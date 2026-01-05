import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import amqp, {
  ChannelWrapper,
  AmqpConnectionManager,
} from 'amqp-connection-manager';

export type MessageHandler = (message: any) => Promise<void>;

@Injectable()
export class RabbitmqService implements OnModuleInit, OnModuleDestroy {
  private channelWrapper: ChannelWrapper;
  private connection: AmqpConnectionManager;
  private readonly logger = new Logger(RabbitmqService.name);
  private subscribedQueues: Map<string, MessageHandler> = new Map();
  private connectionReady: Promise<void>;
  private resolveConnectionReady: () => void;

  constructor() {
    //CREAR PROMESA PARA ESPERAR CONEXIÓN
    this.connectionReady = new Promise((resolve) => {
      this.resolveConnectionReady = resolve;
    });
  }

  /**
   * @description Hook de NestJS que se ejecuta cuando el módulo se inicializa
   */
  async onModuleInit(): Promise<void> {
    await this.initializeConnection();
  }

  /**
   * @description Inicializa la conexión a RabbitMQ
   */
  async initializeConnection(): Promise<void> {
    this.connection = amqp.connect([process.env.RABBITMQ_URL]);

    this.connection.on('connect', () => {
      this.logger.debug('Conectado a RabbitMQ');
    });

    this.connection.on('connectFailed', (err) => {
      this.logger.error('Error conectando a RabbitMQ', err);
    });

    this.connection.on('disconnect', (err) => {
      this.logger.warn('Desconectado de RabbitMQ', err);
    });

    this.channelWrapper = this.connection.createChannel({
      json: true,
      //EL SETUP DE RECONEXIÓN SE MANEJA VIA addSetup EN subscribeToQueue
    });

    //ESPERAR A QUE EL CANAL ESTÉ COMPLETAMENTE LISTO
    await this.channelWrapper.waitForConnect();
    this.logger.debug('Canal RabbitMQ listo');
    this.resolveConnectionReady();
  }

  /**
   * @description Configura el consumidor para una cola específica
   * @param channel - Canal de RabbitMQ
   * @param queueName - Nombre de la cola
   * @param handler - Función para manejar los mensajes recibidos
   * @returns Promise<void>
   */
  async setupQueueConsumer(
    channel: any,
    queueName: string,
    handler: MessageHandler,
  ): Promise<void> {
    try {
      //DECLARAR LA COLA COMO DURABLE
      await channel.assertQueue(queueName, { durable: true });

      //CONSUMIR MENSAJES DE LA COLA
      await channel.consume(
        queueName,
        async (msg: any) => {
          if (msg) {
            try {
              const message = JSON.parse(msg.content.toString());
              this.logger.debug(
                `MENSAJE RECIBIDO EN COLA ${queueName}: ${JSON.stringify(message)}`,
              );

              //EJECUTAR EL HANDLER PERSONALIZADO
              await handler(message);

              //CONFIRMAR EL MENSAJE
              channel.ack(msg);
            } catch (error) {
              this.logger.error(
                `Error procesando mensaje de la cola ${queueName}:`,
                error,
              );
              //RECHAZAR EL MENSAJE Y NO REENCOLARLO
              channel.nack(msg, false, false);
            }
          }
        },
        {
          //NO ACK AUTOMÁTICO, MANEJAMOS MANUALMENTE
          noAck: false,
        },
      );

      this.logger.debug(`Consumidor configurado para la cola: ${queueName}`);
    } catch (error) {
      this.logger.error(
        `Error configurando consumidor para la cola ${queueName}:`,
        error,
      );
    }
  }

  /**
   * @description Suscribe a una cola específica de RabbitMQ con un handler personalizado
   * @param queueName - Nombre de la cola
   * @param handler - Función para procesar los mensajes recibidos
   * @returns Promise<void>
   */
  async subscribeToQueue(
    queueName: string,
    handler: MessageHandler,
  ): Promise<void> {
    //ESPERAR A QUE LA CONEXIÓN ESTÉ LISTA
    await this.connectionReady;

    //EVITAR SUSCRIBIRSE MÚLTIPLES VECES A LA MISMA COLA
    if (this.subscribedQueues.has(queueName)) {
      this.logger.warn(`Ya existe una suscripción a la cola: ${queueName}`);
      return;
    }

    //AGREGAR LA COLA Y SU HANDLER AL MAP DE COLAS SUSCRITAS
    this.subscribedQueues.set(queueName, handler);

    try {
      //CONFIGURAR EL CONSUMIDOR USANDO addSetup PARA MANEJAR RECONEXIONES
      //addSetup EJECUTARÁ INMEDIATAMENTE SI EL CANAL YA EXISTE, Y TAMBIÉN EN RECONEXIONES
      await this.channelWrapper.addSetup(async (channel: any) => {
        await this.setupQueueConsumer(channel, queueName, handler);
      });

      this.logger.debug(`Suscrito a la cola: ${queueName}`);
    } catch (error) {
      //SI HAY ERROR, REMOVER DE LA LISTA
      this.subscribedQueues.delete(queueName);
      this.logger.error(`Error suscribiéndose a la cola ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * @description Desuscribe de una cola específica
   * @param queueName - Nombre de la cola
   * @returns Promise<void>
   */
  async unsubscribeFromQueue(queueName: string): Promise<void> {
    if (!this.subscribedQueues.has(queueName)) {
      this.logger.warn(`No existe suscripción a la cola: ${queueName}`);
      return;
    }

    try {
      this.subscribedQueues.delete(queueName);
      this.logger.warn(`Desuscrito de la cola: ${queueName}`);
    } catch (error) {
      this.logger.error(
        `Error desuscribiéndose de la cola ${queueName}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * @description Publica un mensaje en una cola específica
   * @param queueName - Nombre de la cola
   * @param message - Mensaje a publicar
   * @returns Promise<void>
   */
  async publishToQueue(queueName: string, message: any): Promise<void> {
    try {
      await this.channelWrapper.sendToQueue(queueName, message);
      this.logger.debug(`Mensaje publicado en cola ${queueName}:`, message);
    } catch (error) {
      this.logger.error(
        `Error publicando mensaje en la cola ${queueName}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * @description Verifica si está suscrito a una cola específica
   * @param queueName - Nombre de la cola
   * @returns boolean
   */
  isSubscribedToQueue(queueName: string): boolean {
    return this.subscribedQueues.has(queueName);
  }

  /**
   * @description Obtiene la lista de colas suscritas
   * @returns string[]
   */
  getSubscribedQueues(): string[] {
    return Array.from(this.subscribedQueues.keys());
  }

  /**
   * @description Hook de NestJS que se ejecuta cuando el módulo se destruye
   */
  async onModuleDestroy(): Promise<void> {
    try {
      await this.channelWrapper.close();
      await this.connection.close();
      this.logger.debug('Conexión a RabbitMQ cerrada');
    } catch (error) {
      this.logger.error('Error cerrando conexión a RabbitMQ:', error);
    }
  }
}
