import { Request, Response } from "express";

exports.daily = (req: Request, res: Response) => {
  res.send("Hello from Cloud Functions and Cloud Source Repositories");
};
