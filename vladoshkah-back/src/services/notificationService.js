
import nodemailer from 'nodemailer';
import logger from '../logger.js';

class NotificationService {
  constructor() {

    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {

    if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
      const port = parseInt(process.env.SMTP_PORT) || 587;
      const secure = process.env.SMTP_SECURE === 'true' || port === 465;
      
      const transportConfig = {
        host: process.env.SMTP_HOST,
        port: port,
        secure: secure,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        },
        connectionTimeout: 30000, // 30 секунд для подключения
        greetingTimeout: 30000, // 30 секунд для приветствия
        socketTimeout: 30000, // 30 секунд для операций
      };

      if (!secure) {

        transportConfig.requireTLS = true;
        transportConfig.tls = {
          rejectUnauthorized: false,
          minVersion: 'TLSv1.2'
        };

      } else {

        transportConfig.tls = {
          rejectUnauthorized: false,
          minVersion: 'TLSv1.2'
        };
      }

      if (process.env.SMTP_HOST === 'smtp.gmail.com') {
        transportConfig.pool = false; // Отключаем pooling для отладки
        transportConfig.debug = false; // Можно включить для детальных логов
      }
      
      this.transporter = nodemailer.createTransport(transportConfig);
      
      logger.info({ 
        host: process.env.SMTP_HOST, 
        port: port,
        secure: secure,
        user: process.env.SMTP_USER,
        from: process.env.SMTP_FROM
      }, 'Email transporter configured with SMTP');
    } else {

      this.transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true
      });
      
      logger.info('Email transporter configured in test mode (console only)');
    }
  }

  
  async sendWelcomeEmail(userData) {
    try {
      const { email, firstname, userId } = userData;
      
      if (!email) {
        throw new Error('Email is required to send welcome message');
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@vladoshkah.ru',
        to: email,
        subject: 'Добро пожаловать в vLadoshkah!',
        html: this.getWelcomeEmailTemplate(firstname || 'Пользователь', userId)
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info({ 
        userId, 
        email, 
        messageId: info.messageId 
      }, 'Welcome email sent successfully');

      if (!process.env.SMTP_HOST) {
        logger.info({ email, subject: mailOptions.subject }, 'Email would be sent (test mode)');
      }
      
    } catch (error) {
      logger.error({ err: error, userData }, 'Error sending welcome email');
      throw error;
    }
  }

  
  getWelcomeEmailTemplate(name, userId) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #4CAF50;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 5px 5px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Добро пожаловать в vLadoshkah!</h1>
        </div>
        <div class="content">
          <p>Привет, ${name}!</p>
          <p>Спасибо за регистрацию в нашем сервисе. Теперь вы можете:</p>
          <ul>
            <li>Просматривать животных, нуждающихся в доме</li>
            <li>Подавать заявки на усыновление</li>
            <li>Участвовать в волонтерских программах</li>
          </ul>
          <p>Мы рады видеть вас в нашем сообществе!</p>
          <p>Если у вас есть вопросы, не стесняйтесь обращаться к нам.</p>
          <p>С уважением,<br>Команда vLadoshkah</p>
        </div>
      </body>
      </html>
    `;
  }
}

const notificationService = new NotificationService();

export default notificationService;
