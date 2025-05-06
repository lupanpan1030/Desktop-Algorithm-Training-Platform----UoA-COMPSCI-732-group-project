// middleware to validate problem id in path params
import { Request, Response, NextFunction } from "express";
import { ProblemsService } from "../api/problem/problem-service";

export async function validateProblemId(req: Request, res: Response, next: NextFunction) {
  const problemId = Number(req.params.problemId);
  const problemsService = new ProblemsService();
    // getProblem method will throw 404 if the problem id does not exist
    await problemsService.getProblem(problemId);
    next();
}
