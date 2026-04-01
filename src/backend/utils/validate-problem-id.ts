// middleware to validate problem id in path params
import { Request, Response, NextFunction } from "express";
import { ProblemsService } from "../api/problem/problem-service";

export async function validateProblemId(req: Request, res: Response, next: NextFunction) {
  try {
    const problemId = Number(req.params.problemId);
    const problemsService = new ProblemsService();
    await problemsService.getProblem(problemId);
    next();
  } catch (error) {
    next(error);
  }
}
