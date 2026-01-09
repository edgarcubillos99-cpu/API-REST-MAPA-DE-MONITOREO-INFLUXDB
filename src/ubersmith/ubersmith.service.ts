
import {
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import {
  CreateTicketsUbersmithDto,
} from './dto/create-tickets-ubersmith.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { envs } from 'src/conf';
import { CreateCommentUbersmithDto } from './dto/create-comment.dto';
import { UpdateTicketsUbersmithBasicDto } from './dto/update-tickets-basic-ubersmith.dto';
@Injectable()
export class UbersmithService {

  private readonly ubersmithAuth = {
    username: envs.usernameUbersmith,
    password: envs.passwordUbersmith,
  };

  private readonly ubersmithBaseUrl = envs.urlUbersmith;

  constructor(
    private readonly httpService: HttpService,
  ) {}


  async createTicket(
    createTicketsUbersmithCircuitoDto: CreateTicketsUbersmithDto,
    attach?: Express.Multer.File[],
  ) {

    const form: any = new FormData();

    form.append('body', createTicketsUbersmithCircuitoDto.body);
    form.append('subject', createTicketsUbersmithCircuitoDto.subject);
    form.append('queue', 71); //AVERIAS

    //SI VIENE CC EN EL DTO
    if (
      createTicketsUbersmithCircuitoDto.cc &&
      createTicketsUbersmithCircuitoDto.cc.length > 0
    ) {
      form.append('cc', createTicketsUbersmithCircuitoDto.cc);
    }

    attach?.forEach((file, idx) => {
      form.append(
        `attach[${idx}]`,
        new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }),
        file.originalname,
      );
    });

    try {
      const { data } = await firstValueFrom(
        this.httpService.post(
          `${this.ubersmithBaseUrl}?method=support.ticket_submit`,
          form,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            auth: this.ubersmithAuth,
          },
        ),
      );
      return data.data;
    } catch (error) {
      console.log('ERROR CREANDO CIRCUITO TICKET=', error);
      throw new Error(error);
    }
  }

  async comments(ticketId: number) {
    const { data } = await firstValueFrom(
      this.httpService.get(
        `${this.ubersmithBaseUrl}?method=support.ticket_post_list&ticket_id=${ticketId}&private=0`,
        {
          auth: this.ubersmithAuth,
        },
      ),
    );
    if (!data.status)
      throw new HttpException(data.error_message, HttpStatus.BAD_REQUEST);

    // return Object.values(data.data).map(
    //   ({ body, timestamp, author, hidden, ticket_post_id, attachments }) => ({
    //     body,
    //     timestamp: new Date(parseInt(timestamp) * 1000).toString(), //EN UBERSMITH EL CAMPO TIMESTAMP VIENE EN SEGUNDOS UNIX
    //     author,
    //     postType: hidden == 0 ? 'email' : 'comment',
    //     ticket_post_id,
    //     attachments,
    //   }),
    // );

    const comments = await Promise.all(
      Object.values(data.data).map(async (comment: any) => {
        let attachments: unknown[] = [];
        if (comment.attachments && comment.attachments !== '0') {
          attachments = await this.attachmentsForTicketPost(
            comment.ticket_post_id,
          ) as unknown[];
        }
        return {
          body: comment.body,
          timestamp: new Date(parseInt(comment.timestamp) * 1000).toString(),
          author: comment.author,
          postType: comment.hidden == 0 ? 'email' : 'comment',
          ticket_post_id: comment.ticket_post_id,
          amount_attachments: comment.attachments,
          attachments, //LISTA ARCHIVOS
        };
      }),
    );

    return comments;
  }

  async attachmentsForTicketPost(ticket_post_id: string) {
    const { data } = await firstValueFrom(
      this.httpService.get(
        `${this.ubersmithBaseUrl}?method=uber.attachment_list&attach_type=ticket&id=${ticket_post_id}`,
        {
          auth: this.ubersmithAuth,
        },
      ),
    );
    if (data.status && data.data) {
      return Object.values(data.data);
    }
    return [];
  }

  async getAttachment(attachId: string) {
    const response = await firstValueFrom(
      this.httpService.get(
        `${this.ubersmithBaseUrl}?method=uber.attachment_get&attach_type=ticket&attach_id=${attachId}`,
        {
          responseType: 'stream',
          auth: this.ubersmithAuth,
        },
      ),
    );

    //OBTENER EL NOMBRE Y TIPO DE ARCHIVO DESDE LOS HEADERS
    const filename = response.headers['content-disposition']
      ? response.headers['content-disposition']
          .split('filename=')[1]
          ?.replace(/"/g, '') || 'attachment'
      : 'attachment';
    const contentType =
      response.headers['content-type'] || 'application/octet-stream';

    return {
      stream: response.data,
      filename,
      contentType,
    };
  }

  async addcomment(
    CommentDto: CreateCommentUbersmithDto,
    attach?: Express.Multer.File[],
  ) {
    const form: any = new FormData();

    form.append('ticket_id', String(CommentDto.ticket_id));
    form.append('body', CommentDto.body);
    form.append('comment', String(CommentDto.comment));

    //SI VIENE CC EN EL DTO
    if (CommentDto.cc && CommentDto.cc.length > 0) {
      form.append('cc', CommentDto.cc);
    } 

    if (attach && Array.isArray(attach) && attach.length > 0) {
      attach.forEach((file, idx) => {
        //Convert the buffer to a Blob
        const blob = new Blob([file.buffer as BlobPart], {
          type: file.mimetype,
        });

        form.append(`attach[${idx}]`, blob, file.originalname);
      });
    }

    const { data } = await firstValueFrom(
      this.httpService.post(
        `${this.ubersmithBaseUrl}?method=support.ticket_post_staff_response`,
        form,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          auth: this.ubersmithAuth,
        },
      ),
    );

    if (!data.status)
      throw new HttpException(data.error_message, HttpStatus.BAD_REQUEST);

    return this.comments(CommentDto.ticket_id);
  }


  async addAttachmentToTicket(
    ticketId: number,
    attachments: Array<{ buffer: Buffer; filename: string; mimetype: string }>,
    body?: string,
  ) {
    const form: any = new FormData();

    form.append('ticket_id', String(ticketId));
    form.append('body', body || 'Attachment added');
    form.append('comment', String(1)); // 1 = comment (hidden), 0 = email (visible)

    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      attachments.forEach((file, idx) => {
        //Convert the buffer to a Blob
        //Buffer is compatible with BlobPart, but TypeScript needs explicit conversion
        const blob = new Blob([new Uint8Array(file.buffer)], {
          type: file.mimetype,
        });

        form.append(`attach[${idx}]`, blob, file.filename);
      });
    }

    const { data } = await firstValueFrom(
      this.httpService.post(
        `${this.ubersmithBaseUrl}?method=support.ticket_post_staff_response`,
        form,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          auth: this.ubersmithAuth,
        },
      ),
    );

    if (!data.status)
      throw new HttpException(data.error_message, HttpStatus.BAD_REQUEST);

    return data.data;
  }


  async findTicket(ticketIdMain: number) {
    const { data } = await firstValueFrom(
      this.httpService.post(
        `${this.ubersmithBaseUrl}?method=support.ticket_get`,
        {
          ticket_id: ticketIdMain,
        },
        {
          auth: this.ubersmithAuth,
        },
      ),
    );

    if (!data.status)
      throw new HttpException(data.error_message, HttpStatus.NOT_FOUND);
  }

  async closedTicket(tickets: number[]) {
    for (const ticket_id of tickets) {
      //HACIENDO LA PETICION Y CERRANDO EL TICKET
      await firstValueFrom(
        this.httpService.post(
          `${this.ubersmithBaseUrl}?method=support.ticket_update`,
          {
            ticket_id,
            type: 4,
            meta_resolution_type: 'Invalid-Invalid',
          },
          {
            auth: this.ubersmithAuth,
          },
        ),
      );
    }
  }

  async getTicket(ticketId: string) {
    const { data } = await firstValueFrom(
      this.httpService.get(
        `${this.ubersmithBaseUrl}?method=support.ticket_get&ticket_id=${ticketId}`,
        {
          auth: this.ubersmithAuth,
        },
      ),
    );

    if (!data.status)
      throw new HttpException(data.error_message, HttpStatus.NOT_FOUND);

    return data.data;
  }

  async listDepartment() {
    const { data } = await firstValueFrom(
      this.httpService.get(
        `${this.ubersmithBaseUrl}?method=support.department_list`,
        {
          auth: this.ubersmithAuth,
        },
      ),
    );

    if (!data.status)
      throw new HttpException(data.error_message, HttpStatus.NOT_FOUND);

    const departments = Object.values(data.data).map(({ q_id, name }) => ({
      q_id,
      name,
    }));

    return departments;
  }

  async listResolution() {
    const key = 'resolutions-list';


    const { data } = await firstValueFrom(
      this.httpService.get(
        `${this.ubersmithBaseUrl}?method=support.resolution_list`,
        {
          auth: this.ubersmithAuth,
        },
      ),
    );

    if (!data.status)
      throw new HttpException(data.error_message, HttpStatus.NOT_FOUND);

    const resolutions = Object.values(data.data).map(
      ({ ticket_resolution_id, name }) => ({
        ticket_resolution_id,
        name,
      }),
    );

    return resolutions;
  }

  async listUsersLogin() {

    const { data } = await firstValueFrom(
      this.httpService.get(
        `${this.ubersmithBaseUrl}?method=uber.admin_list&active=1`,
        {
          auth: this.ubersmithAuth,
        },
      ),
    );

    if (!data.status)
      throw new HttpException(data.error_message, HttpStatus.NOT_FOUND);

    const users = Object.values(data.data).map(
      ({ id, name, email, username }) => ({
        id,
        name,
        email,
        username,
      }),
    );

    return users;
  }

  async updateTicket(
    ticketId: string,
    updateTicketUbersmithDto: UpdateTicketsUbersmithBasicDto,
  ) {
    const { data } = await firstValueFrom(
      this.httpService.post(
        `${this.ubersmithBaseUrl}?method=support.ticket_update`,
        {
          ticket_id: ticketId,
          ...updateTicketUbersmithDto,
          /*
          queue, //Department | supportFiberx
          priority, //0 = Low, 1= Normal, 2 = High, 3 = 911 //LA LISTA NO ESTA EN API UBERSMITH
          impact, //0 = No Impact 1 = Minor/Localized 2 = Moderate/Limited 3 = Significant/Large 4 = Extensive/Widespread //LA LISTA NO ESTA EN API UBERSMITH
          ticket_resolution_id, //1 = Fixed, 4 = Completed, 10 = Unknown, 2 = Invalid, 6 = Coverage, 9 = Capacity, 11 = Equipment, 7 = Documentation, 8 = Expired, 3 = Duplicate
          */
        },
        {
          auth: this.ubersmithAuth,
        },
      ),
    );

    if (!data.status)
      throw new HttpException(data.error_message, HttpStatus.NOT_FOUND);

    return data.data;
  }
}
