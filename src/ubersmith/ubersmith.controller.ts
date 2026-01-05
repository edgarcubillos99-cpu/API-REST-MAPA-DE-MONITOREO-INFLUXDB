import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Res,
  UploadedFiles,
  UseInterceptors,
  ParseIntPipe,
} from '@nestjs/common';
import { UbersmithService } from './ubersmith.service';
import { CreateTicketsUbersmithDto } from './dto/create-tickets-ubersmith.dto';
import { CreateCommentUbersmithDto } from './dto/create-comment.dto';
import { UpdateTicketsUbersmithBasicDto } from './dto/update-tickets-basic-ubersmith.dto';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import { AuthSwagger } from 'src/common/decorator/auth-swagger.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

@ApiTags('ubersmith')
@Controller('ubersmith')
export class UbersmithController {
  constructor(private readonly ubersmithService: UbersmithService) {}

  // ==================== TICKETS ====================

  @Post('tickets')
  @AuthSwagger()
  @ApiOperation({ summary: 'Crear un nuevo ticket' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('attach'))
  createTicket(
    @Body() createTicketsUbersmithDto: CreateTicketsUbersmithDto,
    @UploadedFiles() attach?: Express.Multer.File[],
  ) {
    return this.ubersmithService.createTicket(createTicketsUbersmithDto, attach);
  }

  @Get('tickets/:ticketId')
  @AuthSwagger()
  @ApiOperation({ summary: 'Obtener información de un ticket' })
  getTicket(@Param('ticketId') ticketId: string) {
    return this.ubersmithService.getTicket(ticketId);
  }

  @Patch('tickets/:ticketId')
  @AuthSwagger()
  @ApiOperation({ summary: 'Actualizar un ticket' })
  updateTicket(
    @Param('ticketId') ticketId: string,
    @Body() updateTicketUbersmithDto: UpdateTicketsUbersmithBasicDto,
  ) {
    return this.ubersmithService.updateTicket(ticketId, updateTicketUbersmithDto);
  }

  @Post('tickets/close')
  @AuthSwagger()
  @ApiOperation({ summary: 'Cerrar múltiples tickets' })
  @ApiBody({ schema: { type: 'object', properties: { tickets: { type: 'array', items: { type: 'number' } } } } })
  closedTicket(@Body('tickets') tickets: number[]) {
    return this.ubersmithService.closedTicket(tickets);
  }

  // ==================== COMMENTS ====================

  @Get('tickets/:ticketId/comments')
  @AuthSwagger()
  @ApiOperation({ summary: 'Obtener comentarios de un ticket' })
  getComments(@Param('ticketId', ParseIntPipe) ticketId: number) {
    return this.ubersmithService.comments(ticketId);
  }

  @Post('tickets/:ticketId/comments')
  @AuthSwagger()
  @ApiOperation({ summary: 'Agregar comentario a un ticket' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('attach'))
  addComment(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Body() createCommentDto: CreateCommentUbersmithDto,
    @UploadedFiles() attach?: Express.Multer.File[],
  ) {
    // Asegurar que el ticket_id del param se use
    createCommentDto.ticket_id = ticketId;
    return this.ubersmithService.addcomment(createCommentDto, attach);
  }

  // ==================== ATTACHMENTS ====================

  @Get('posts/:postId/attachments')
  @AuthSwagger()
  @ApiOperation({ summary: 'Obtener lista de archivos adjuntos de un post' })
  getAttachmentsForPost(@Param('postId') postId: string) {
    return this.ubersmithService.attachmentsForTicketPost(postId);
  }

  @Get('attachments/:attachId')
  @AuthSwagger()
  @ApiOperation({ summary: 'Descargar un archivo adjunto' })
  async getAttachment(
    @Param('attachId') attachId: string,
    @Res() res: Response,
  ) {
    const { stream, filename, contentType } = await this.ubersmithService.getAttachment(attachId);

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    stream.pipe(res);
  }

  // ==================== DEPARTMENTS ====================

  @Get('departments')
  @AuthSwagger()
  @ApiOperation({ summary: 'Listar departamentos' })
  listDepartments() {
    return this.ubersmithService.listDepartment();
  }

  // ==================== RESOLUTIONS ====================

  @Get('resolutions')
  @AuthSwagger()
  @ApiOperation({ summary: 'Listar tipos de resolución' })
  listResolutions() {
    return this.ubersmithService.listResolution();
  }

  // ==================== USERS ====================

  @Get('users')
  @AuthSwagger()
  @ApiOperation({ summary: 'Listar usuarios de Ubersmith' })
  listUsers() {
    return this.ubersmithService.listUsersLogin();
  }
}
