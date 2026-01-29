import app from '../domain/dist/app';

const handler = (req: any, res: any, next: any) => {
  req.url = `/api${req.url}`;
  return app(req, res, next);
};

export default handler;
