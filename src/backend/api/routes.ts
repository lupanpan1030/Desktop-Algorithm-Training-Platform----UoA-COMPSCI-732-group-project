/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from '@tsoa/runtime';
import {  fetchMiddlewares, ExpressTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ProblemsController } from './problems/problem-controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { LanguageController } from './language/language-controller';
import type { Request as ExRequest, Response as ExResponse, RequestHandler, Router } from 'express';



// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
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
        "additionalProperties": true,
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
        "additionalProperties": true,
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
        "additionalProperties": true,
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
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_CreateLanguageDto_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"name":{"dataType":"string"},"suffix":{"dataType":"string"},"version":{"dataType":"string"},"compile_command":{"dataType":"string"},"run_command":{"dataType":"string"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new ExpressTemplateService(models, {"noImplicitAdditionalProperties":"ignore","bodyCoercion":true});

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa




export function RegisterRoutes(app: Router) {

    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################


    
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
                successStatus: undefined,
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
                successStatus: undefined,
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
