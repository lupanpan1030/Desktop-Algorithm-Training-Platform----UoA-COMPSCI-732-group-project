/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from '@tsoa/runtime';
import {  fetchMiddlewares, ExpressTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { TestCaseController } from './testcase/testcase-controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { SubmissionController } from './submission/submission-controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ProblemSubmissionController } from './submission/submission-controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ProblemsController } from './problems/problem-controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { LanguageController } from './language/language-controller';
import type { Request as ExRequest, Response as ExResponse, RequestHandler, Router } from 'express';



// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "TestCase": {
        "dataType": "refObject",
        "properties": {
            "testcaseId": {"dataType":"double","required":true},
            "input": {"dataType":"string","required":true},
            "expectedOutput": {"dataType":"string","required":true},
            "timeLimitMs": {"dataType":"double","required":true},
            "memoryLimitMb": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "NotFoundError": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "stack": {"dataType":"string"},
            "statusCode": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ValidateError": {
        "dataType": "refObject",
        "properties": {
            "message": {"dataType":"enum","enums":["Validation failed"],"required":true},
            "details": {"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"any"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateTestCaseParams": {
        "dataType": "refObject",
        "properties": {
            "input": {"dataType":"string","required":true,"validators":{"minLength":{"value":1}}},
            "expectedOutput": {"dataType":"string","required":true,"validators":{"minLength":{"value":1}}},
            "timeLimitMs": {"dataType":"double","required":true,"validators":{"minimum":{"value":100},"maximum":{"value":10000}}},
            "memoryLimitMb": {"dataType":"double","required":true,"validators":{"minimum":{"errorMsg":"* 1024","value":16},"maximum":{"errorMsg":"* 1024","value":1024}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SubmissionListItemDto": {
        "dataType": "refObject",
        "properties": {
            "submissionId": {"dataType":"double","required":true},
            "code": {"dataType":"string","required":true},
            "languageId": {"dataType":"double","required":true},
            "status": {"dataType":"string","required":true},
            "submittedAt": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SubmissionResultDto": {
        "dataType": "refObject",
        "properties": {
            "status": {"dataType":"string","required":true},
            "output": {"dataType":"string"},
            "runtimeMs": {"dataType":"double","required":true},
            "memoryKb": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SubmissionDetailDto": {
        "dataType": "refObject",
        "properties": {
            "submissionId": {"dataType":"double","required":true},
            "code": {"dataType":"string","required":true},
            "languageId": {"dataType":"double","required":true},
            "status": {"dataType":"string","required":true},
            "submittedAt": {"dataType":"string","required":true},
            "results": {"dataType":"array","array":{"dataType":"refObject","ref":"SubmissionResultDto"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RunCodeResponseDto": {
        "dataType": "refObject",
        "properties": {
            "status": {"dataType":"string","required":true},
            "results": {"dataType":"array","array":{"dataType":"refObject","ref":"SubmissionResultDto"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RunCodeDto": {
        "dataType": "refObject",
        "properties": {
            "code": {"dataType":"string","required":true},
            "languageId": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SubmitCodeResponseDto": {
        "dataType": "refObject",
        "properties": {
            "submissionId": {"dataType":"double","required":true},
            "overallStatus": {"dataType":"string","required":true},
            "results": {"dataType":"array","array":{"dataType":"refObject","ref":"SubmissionResultDto"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SubmitCodeDto": {
        "dataType": "refObject",
        "properties": {
            "code": {"dataType":"string","required":true},
            "languageId": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "_36_Enums.Difficulty": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["EASY"]},{"dataType":"enum","enums":["MEDIUM"]},{"dataType":"enum","enums":["HARD"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Difficulty": {
        "dataType": "refAlias",
        "type": {"ref":"_36_Enums.Difficulty","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ProblemSummary": {
        "dataType": "refObject",
        "properties": {
            "problemId": {"dataType":"double","required":true},
            "title": {"dataType":"string","required":true},
            "difficulty": {"ref":"Difficulty","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ProblemDetails": {
        "dataType": "refObject",
        "properties": {
            "problemId": {"dataType":"double","required":true},
            "title": {"dataType":"string","required":true},
            "difficulty": {"ref":"Difficulty","required":true},
            "description": {"dataType":"string","required":true},
            "createdAt": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateProblemParams": {
        "dataType": "refObject",
        "properties": {
            "title": {"dataType":"string","required":true,"validators":{"minLength":{"value":5},"maxLength":{"value":100}}},
            "description": {"dataType":"string","required":true,"validators":{"minLength":{"value":10},"maxLength":{"value":2000}}},
            "difficulty": {"ref":"Difficulty","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateProblemParams": {
        "dataType": "refObject",
        "properties": {
            "title": {"dataType":"string","validators":{"minLength":{"value":5},"maxLength":{"value":100}}},
            "description": {"dataType":"string","validators":{"minLength":{"value":10},"maxLength":{"value":2000}}},
            "difficulty": {"ref":"Difficulty"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ProgrammingLanguage": {
        "dataType": "refObject",
        "properties": {
            "language_id": {"dataType":"double","required":true},
            "name": {"dataType":"string","required":true},
            "suffix": {"dataType":"string","required":true},
            "version": {"dataType":"string","required":true},
            "compile_command": {"dataType":"string","required":true},
            "run_command": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateLanguageDto": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "suffix": {"dataType":"string","required":true},
            "version": {"dataType":"string","required":true},
            "compile_command": {"dataType":"string","required":true},
            "run_command": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_CreateLanguageDto_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"name":{"dataType":"string"},"suffix":{"dataType":"string"},"version":{"dataType":"string"},"compile_command":{"dataType":"string"},"run_command":{"dataType":"string"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new ExpressTemplateService(models, {"noImplicitAdditionalProperties":"silently-remove-extras","bodyCoercion":true});

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa




export function RegisterRoutes(app: Router) {

    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################


    
        const argsTestCaseController_getTestCases: Record<string, TsoaRoute.ParameterSchema> = {
                problemId: {"in":"path","name":"problemId","required":true,"dataType":"double"},
        };
        app.get('/problems/:problemId/testcases',
            ...(fetchMiddlewares<RequestHandler>(TestCaseController)),
            ...(fetchMiddlewares<RequestHandler>(TestCaseController.prototype.getTestCases)),

            async function TestCaseController_getTestCases(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTestCaseController_getTestCases, request, response });

                const controller = new TestCaseController();

              await templateService.apiHandler({
                methodName: 'getTestCases',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTestCaseController_createTestCase: Record<string, TsoaRoute.ParameterSchema> = {
                problemId: {"in":"path","name":"problemId","required":true,"dataType":"double"},
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"CreateTestCaseParams"},
        };
        app.post('/problems/:problemId/testcases',
            ...(fetchMiddlewares<RequestHandler>(TestCaseController)),
            ...(fetchMiddlewares<RequestHandler>(TestCaseController.prototype.createTestCase)),

            async function TestCaseController_createTestCase(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTestCaseController_createTestCase, request, response });

                const controller = new TestCaseController();

              await templateService.apiHandler({
                methodName: 'createTestCase',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTestCaseController_deleteTestCase: Record<string, TsoaRoute.ParameterSchema> = {
                problemId: {"in":"path","name":"problemId","required":true,"dataType":"double"},
                testcaseId: {"in":"path","name":"testcaseId","required":true,"dataType":"double"},
        };
        app.delete('/problems/:problemId/testcases/:testcaseId',
            ...(fetchMiddlewares<RequestHandler>(TestCaseController)),
            ...(fetchMiddlewares<RequestHandler>(TestCaseController.prototype.deleteTestCase)),

            async function TestCaseController_deleteTestCase(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTestCaseController_deleteTestCase, request, response });

                const controller = new TestCaseController();

              await templateService.apiHandler({
                methodName: 'deleteTestCase',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 204,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSubmissionController_getSubmissions: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/submissions',
            ...(fetchMiddlewares<RequestHandler>(SubmissionController)),
            ...(fetchMiddlewares<RequestHandler>(SubmissionController.prototype.getSubmissions)),

            async function SubmissionController_getSubmissions(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSubmissionController_getSubmissions, request, response });

                const controller = new SubmissionController();

              await templateService.apiHandler({
                methodName: 'getSubmissions',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSubmissionController_getSubmission: Record<string, TsoaRoute.ParameterSchema> = {
                submissionId: {"in":"path","name":"submissionId","required":true,"dataType":"double"},
        };
        app.get('/submissions/:submissionId',
            ...(fetchMiddlewares<RequestHandler>(SubmissionController)),
            ...(fetchMiddlewares<RequestHandler>(SubmissionController.prototype.getSubmission)),

            async function SubmissionController_getSubmission(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSubmissionController_getSubmission, request, response });

                const controller = new SubmissionController();

              await templateService.apiHandler({
                methodName: 'getSubmission',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProblemSubmissionController_runCode: Record<string, TsoaRoute.ParameterSchema> = {
                problemId: {"in":"path","name":"problemId","required":true,"dataType":"double"},
                dto: {"in":"body","name":"dto","required":true,"ref":"RunCodeDto"},
        };
        app.post('/problems/:problemId/run',
            ...(fetchMiddlewares<RequestHandler>(ProblemSubmissionController)),
            ...(fetchMiddlewares<RequestHandler>(ProblemSubmissionController.prototype.runCode)),

            async function ProblemSubmissionController_runCode(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProblemSubmissionController_runCode, request, response });

                const controller = new ProblemSubmissionController();

              await templateService.apiHandler({
                methodName: 'runCode',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProblemSubmissionController_submitCode: Record<string, TsoaRoute.ParameterSchema> = {
                problemId: {"in":"path","name":"problemId","required":true,"dataType":"double"},
                dto: {"in":"body","name":"dto","required":true,"ref":"SubmitCodeDto"},
        };
        app.post('/problems/:problemId/submit',
            ...(fetchMiddlewares<RequestHandler>(ProblemSubmissionController)),
            ...(fetchMiddlewares<RequestHandler>(ProblemSubmissionController.prototype.submitCode)),

            async function ProblemSubmissionController_submitCode(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProblemSubmissionController_submitCode, request, response });

                const controller = new ProblemSubmissionController();

              await templateService.apiHandler({
                methodName: 'submitCode',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProblemsController_getAllProblems: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/problems',
            ...(fetchMiddlewares<RequestHandler>(ProblemsController)),
            ...(fetchMiddlewares<RequestHandler>(ProblemsController.prototype.getAllProblems)),

            async function ProblemsController_getAllProblems(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProblemsController_getAllProblems, request, response });

                const controller = new ProblemsController();

              await templateService.apiHandler({
                methodName: 'getAllProblems',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProblemsController_getProblem: Record<string, TsoaRoute.ParameterSchema> = {
                problemId: {"in":"path","name":"problemId","required":true,"dataType":"double"},
        };
        app.get('/problems/:problemId',
            ...(fetchMiddlewares<RequestHandler>(ProblemsController)),
            ...(fetchMiddlewares<RequestHandler>(ProblemsController.prototype.getProblem)),

            async function ProblemsController_getProblem(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProblemsController_getProblem, request, response });

                const controller = new ProblemsController();

              await templateService.apiHandler({
                methodName: 'getProblem',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProblemsController_createProblem: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"CreateProblemParams"},
        };
        app.post('/problems',
            ...(fetchMiddlewares<RequestHandler>(ProblemsController)),
            ...(fetchMiddlewares<RequestHandler>(ProblemsController.prototype.createProblem)),

            async function ProblemsController_createProblem(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProblemsController_createProblem, request, response });

                const controller = new ProblemsController();

              await templateService.apiHandler({
                methodName: 'createProblem',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProblemsController_updateProblem: Record<string, TsoaRoute.ParameterSchema> = {
                problemId: {"in":"path","name":"problemId","required":true,"dataType":"double"},
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpdateProblemParams"},
        };
        app.put('/problems/:problemId',
            ...(fetchMiddlewares<RequestHandler>(ProblemsController)),
            ...(fetchMiddlewares<RequestHandler>(ProblemsController.prototype.updateProblem)),

            async function ProblemsController_updateProblem(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProblemsController_updateProblem, request, response });

                const controller = new ProblemsController();

              await templateService.apiHandler({
                methodName: 'updateProblem',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProblemsController_deleteProblem: Record<string, TsoaRoute.ParameterSchema> = {
                problemId: {"in":"path","name":"problemId","required":true,"dataType":"double"},
        };
        app.delete('/problems/:problemId',
            ...(fetchMiddlewares<RequestHandler>(ProblemsController)),
            ...(fetchMiddlewares<RequestHandler>(ProblemsController.prototype.deleteProblem)),

            async function ProblemsController_deleteProblem(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProblemsController_deleteProblem, request, response });

                const controller = new ProblemsController();

              await templateService.apiHandler({
                methodName: 'deleteProblem',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 204,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLanguageController_getLanguages: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/language',
            ...(fetchMiddlewares<RequestHandler>(LanguageController)),
            ...(fetchMiddlewares<RequestHandler>(LanguageController.prototype.getLanguages)),

            async function LanguageController_getLanguages(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLanguageController_getLanguages, request, response });

                const controller = new LanguageController();

              await templateService.apiHandler({
                methodName: 'getLanguages',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLanguageController_create: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"CreateLanguageDto"},
        };
        app.post('/language',
            ...(fetchMiddlewares<RequestHandler>(LanguageController)),
            ...(fetchMiddlewares<RequestHandler>(LanguageController.prototype.create)),

            async function LanguageController_create(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLanguageController_create, request, response });

                const controller = new LanguageController();

              await templateService.apiHandler({
                methodName: 'create',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLanguageController_update: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"double"},
                body: {"in":"body","name":"body","required":true,"ref":"Partial_CreateLanguageDto_"},
        };
        app.put('/language/:id',
            ...(fetchMiddlewares<RequestHandler>(LanguageController)),
            ...(fetchMiddlewares<RequestHandler>(LanguageController.prototype.update)),

            async function LanguageController_update(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLanguageController_update, request, response });

                const controller = new LanguageController();

              await templateService.apiHandler({
                methodName: 'update',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLanguageController_remove: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"double"},
        };
        app.delete('/language/:id',
            ...(fetchMiddlewares<RequestHandler>(LanguageController)),
            ...(fetchMiddlewares<RequestHandler>(LanguageController.prototype.remove)),

            async function LanguageController_remove(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLanguageController_remove, request, response });

                const controller = new LanguageController();

              await templateService.apiHandler({
                methodName: 'remove',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa


    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
