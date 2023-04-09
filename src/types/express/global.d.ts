import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: Record<string, any>;
      file: Express.Multer.File;
    }
  }
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      FRONTEND_URL: string;
      PORT: number;
      JWT_SECRET: string;
    }
  }
}

declare module "socket.io" {
  interface Socket {
    user?: {
      userId: string;
      email: string;
    };
  }
}

export {};
