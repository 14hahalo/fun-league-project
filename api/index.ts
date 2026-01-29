import app from '../domain/dist/app';

const handler = (req: any, res: any, next: any) => {
  return app(req, res, next);
};

export default handler;
