import { Request, Response, NextFunction } from "express";
import { ZodType, ZodError } from "zod";

export const validate = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));

        res.status(400).json({
          status: "error",
          message: "Validasyon hatası",
          errors: errorMessages,
        });
        return;
      }
      next(error);
    }
  };
};
