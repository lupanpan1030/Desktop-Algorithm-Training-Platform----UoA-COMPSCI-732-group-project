/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from '@tsoa/runtime';
import {  fetchMiddlewares, ExpressTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { TestCaseController } from './testcase/testcase-controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ProblemSubmissionController } from './submission/submission-controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AiSettingsController } from './settings/ai-settings-controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ProblemsController } from './problem/problem-controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { LanguageController } from './language/language-controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AiController } from './ai/ai-controller';
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
            "isSample": {"dataType":"boolean","required":true},
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
            "memoryLimitMb": {"dataType":"double","required":true,"validators":{"minimum":{"value":16},"maximum":{"value":1024}}},
            "isSample": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateTestCaseParams": {
        "dataType": "refObject",
        "properties": {
            "input": {"dataType":"string","validators":{"minLength":{"value":1}}},
            "expectedOutput": {"dataType":"string","validators":{"minLength":{"value":1}}},
            "timeLimitMs": {"dataType":"double","validators":{"minimum":{"value":100},"maximum":{"value":10000}}},
            "memoryLimitMb": {"dataType":"double","validators":{"minimum":{"value":16},"maximum":{"value":1024}}},
            "isSample": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SubmissionResultDto": {
        "dataType": "refObject",
        "properties": {
            "status": {"dataType":"string","required":true},
            "output": {"dataType":"string"},
            "stdout": {"dataType":"string"},
            "stderr": {"dataType":"string"},
            "exitCode": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}]},
            "phase": {"dataType":"string"},
            "timedOut": {"dataType":"boolean"},
            "expectedOutput": {"dataType":"string"},
            "runtimeMs": {"dataType":"double","required":true},
            "memoryKb": {"dataType":"double","required":true},
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
            "code": {"dataType":"string","required":true,"validators":{"minLength":{"value":1}}},
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
            "code": {"dataType":"string","required":true,"validators":{"minLength":{"value":1}}},
            "languageId": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SubmissionListItemDto": {
        "dataType": "refObject",
        "properties": {
            "submissionId": {"dataType":"double","required":true},
            "languageId": {"dataType":"double","required":true},
            "status": {"dataType":"string","required":true},
            "submittedAt": {"dataType":"string","required":true},
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
    "AiSettingsDto": {
        "dataType": "refObject",
        "properties": {
            "provider": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["mock"]},{"dataType":"enum","enums":["openai"]}],"required":true},
            "model": {"dataType":"string","required":true},
            "baseUrl": {"dataType":"string","required":true},
            "timeoutMs": {"dataType":"double","required":true},
            "apiKeyConfigured": {"dataType":"boolean","required":true},
            "apiKeySource": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["saved"]},{"dataType":"enum","enums":["environment"]},{"dataType":"enum","enums":["none"]}],"required":true},
            "apiKeyPreview": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "status": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["preview"]},{"dataType":"enum","enums":["ready"]},{"dataType":"enum","enums":["misconfigured"]}],"required":true},
            "statusLabel": {"dataType":"string","required":true},
            "statusReason": {"dataType":"string","required":true},
            "storagePath": {"dataType":"string","required":true},
            "storageScope": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateAiSettingsRequestDto": {
        "dataType": "refObject",
        "properties": {
            "provider": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["mock"]},{"dataType":"enum","enums":["openai"]}]},
            "apiKey": {"dataType":"string"},
            "clearApiKey": {"dataType":"boolean"},
            "model": {"dataType":"string"},
            "baseUrl": {"dataType":"string"},
            "timeoutMs": {"dataType":"double"},
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
    "CompletionState": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["Completed"]},{"dataType":"enum","enums":["Attempted"]},{"dataType":"enum","enums":["Unattempted"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ProblemSummary": {
        "dataType": "refObject",
        "properties": {
            "problemId": {"dataType":"double","required":true},
            "title": {"dataType":"string","required":true},
            "difficulty": {"ref":"Difficulty","required":true},
            "completionState": {"ref":"CompletionState","required":true},
            "source": {"dataType":"string","required":true},
            "locale": {"dataType":"string","required":true},
            "defaultLocale": {"dataType":"string","required":true},
            "availableLocales": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "sourceSlug": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "externalProblemId": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "judgeReady": {"dataType":"boolean","required":true},
            "testcaseCount": {"dataType":"double","required":true},
            "sampleCaseCount": {"dataType":"double","required":true},
            "hiddenCaseCount": {"dataType":"double","required":true},
            "sampleReferenceAvailable": {"dataType":"boolean","required":true},
            "tags": {"dataType":"array","array":{"dataType":"string"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "StarterCodeSnippet": {
        "dataType": "refObject",
        "properties": {
            "languageSlug": {"dataType":"string","required":true},
            "languageName": {"dataType":"string","required":true},
            "template": {"dataType":"string","required":true},
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
            "source": {"dataType":"string","required":true},
            "locale": {"dataType":"string","required":true},
            "defaultLocale": {"dataType":"string","required":true},
            "availableLocales": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "sourceSlug": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "externalProblemId": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "judgeReady": {"dataType":"boolean","required":true},
            "testcaseCount": {"dataType":"double","required":true},
            "sampleReferenceAvailable": {"dataType":"boolean","required":true},
            "sampleTestcase": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "sampleCaseCount": {"dataType":"double","required":true},
            "hiddenCaseCount": {"dataType":"double","required":true},
            "tags": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "starterCodes": {"dataType":"array","array":{"dataType":"refObject","ref":"StarterCodeSnippet"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateProblemParams": {
        "dataType": "refObject",
        "properties": {
            "title": {"dataType":"string","required":true,"validators":{"minLength":{"value":5},"maxLength":{"value":100}}},
            "description": {"dataType":"string","required":true,"validators":{"minLength":{"value":10},"maxLength":{"value":200000}}},
            "difficulty": {"ref":"Difficulty","required":true},
            "locale": {"dataType":"string","validators":{"minLength":{"value":2},"maxLength":{"value":16}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateProblemParams": {
        "dataType": "refObject",
        "properties": {
            "title": {"dataType":"string","validators":{"minLength":{"value":5},"maxLength":{"value":100}}},
            "description": {"dataType":"string","validators":{"minLength":{"value":10},"maxLength":{"value":200000}}},
            "difficulty": {"ref":"Difficulty"},
            "locale": {"dataType":"string","validators":{"minLength":{"value":2},"maxLength":{"value":16}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LanguageDto": {
        "dataType": "refObject",
        "properties": {
            "languageId": {"dataType":"double","required":true},
            "name": {"dataType":"string","required":true},
            "suffix": {"dataType":"string","required":true},
            "version": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "compilerCmd": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "runtimeCmd": {"dataType":"string","required":true},
            "compile_command": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "run_command": {"dataType":"string"},
            "isDefault": {"dataType":"boolean","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ConflictError": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "stack": {"dataType":"string"},
            "statusCode": {"dataType":"double","default":409},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateLanguageRequestDto": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true,"validators":{"minLength":{"value":1},"maxLength":{"value":50}}},
            "runtimeCmd": {"dataType":"string","required":true,"validators":{"minLength":{"value":1}}},
            "run_command": {"dataType":"string"},
            "compile_command": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "compilerCmd": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "version": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "suffix": {"dataType":"string","required":true,"validators":{"minLength":{"value":1}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateLanguageRequestDto": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string"},
            "runtimeCmd": {"dataType":"string"},
            "run_command": {"dataType":"string"},
            "compile_command": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "compilerCmd": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "version": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "suffix": {"dataType":"string","validators":{"minLength":{"value":1}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ForbiddenError": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "stack": {"dataType":"string"},
            "statusCode": {"dataType":"double","default":403},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AiSuggestionDto": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "label": {"dataType":"string","required":true},
            "prompt": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AiRespondResponseDto": {
        "dataType": "refObject",
        "properties": {
            "answer": {"dataType":"string","required":true},
            "suggestions": {"dataType":"array","array":{"dataType":"refObject","ref":"AiSuggestionDto"},"required":true},
            "inferredIntent": {"dataType":"string","required":true},
            "sourcesUsed": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "provider": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AiContextFactDto": {
        "dataType": "refObject",
        "properties": {
            "key": {"dataType":"string","required":true},
            "label": {"dataType":"string","required":true},
            "value": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AiPageContextDto": {
        "dataType": "refObject",
        "properties": {
            "pageKind": {"dataType":"string","required":true,"validators":{"minLength":{"value":1}}},
            "route": {"dataType":"string","required":true,"validators":{"minLength":{"value":1}}},
            "pageTitle": {"dataType":"string","required":true,"validators":{"minLength":{"value":1}}},
            "summary": {"dataType":"string","required":true,"validators":{"minLength":{"value":1}}},
            "locale": {"dataType":"string"},
            "facts": {"dataType":"array","array":{"dataType":"refObject","ref":"AiContextFactDto"}},
            "contextText": {"dataType":"array","array":{"dataType":"string"}},
            "suggestedPrompts": {"dataType":"array","array":{"dataType":"string"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AiConversationTurnDto": {
        "dataType": "refObject",
        "properties": {
            "role": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["user"]},{"dataType":"enum","enums":["assistant"]}],"required":true},
            "content": {"dataType":"string","required":true,"validators":{"minLength":{"value":1}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AiRespondRequestDto": {
        "dataType": "refObject",
        "properties": {
            "action": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["suggest"]},{"dataType":"enum","enums":["answer"]}]},
            "userMessage": {"dataType":"string"},
            "pageContext": {"ref":"AiPageContextDto","required":true},
            "conversation": {"dataType":"array","array":{"dataType":"refObject","ref":"AiConversationTurnDto"}},
        },
        "additionalProperties": false,
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
        const argsTestCaseController_updateTestCase: Record<string, TsoaRoute.ParameterSchema> = {
                problemId: {"in":"path","name":"problemId","required":true,"dataType":"double"},
                testcaseId: {"in":"path","name":"testcaseId","required":true,"dataType":"double"},
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpdateTestCaseParams"},
        };
        app.put('/problems/:problemId/testcases/:testcaseId',
            ...(fetchMiddlewares<RequestHandler>(TestCaseController)),
            ...(fetchMiddlewares<RequestHandler>(TestCaseController.prototype.updateTestCase)),

            async function TestCaseController_updateTestCase(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTestCaseController_updateTestCase, request, response });

                const controller = new TestCaseController();

              await templateService.apiHandler({
                methodName: 'updateTestCase',
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
                successStatus: 200,
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
        const argsProblemSubmissionController_getSubmissionsByProblem: Record<string, TsoaRoute.ParameterSchema> = {
                problemId: {"in":"path","name":"problemId","required":true,"dataType":"double"},
        };
        app.get('/problems/:problemId/submissions',
            ...(fetchMiddlewares<RequestHandler>(ProblemSubmissionController)),
            ...(fetchMiddlewares<RequestHandler>(ProblemSubmissionController.prototype.getSubmissionsByProblem)),

            async function ProblemSubmissionController_getSubmissionsByProblem(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProblemSubmissionController_getSubmissionsByProblem, request, response });

                const controller = new ProblemSubmissionController();

              await templateService.apiHandler({
                methodName: 'getSubmissionsByProblem',
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
        const argsProblemSubmissionController_getSubmissionByProblem: Record<string, TsoaRoute.ParameterSchema> = {
                problemId: {"in":"path","name":"problemId","required":true,"dataType":"double"},
                submissionId: {"in":"path","name":"submissionId","required":true,"dataType":"double"},
        };
        app.get('/problems/:problemId/submissions/:submissionId',
            ...(fetchMiddlewares<RequestHandler>(ProblemSubmissionController)),
            ...(fetchMiddlewares<RequestHandler>(ProblemSubmissionController.prototype.getSubmissionByProblem)),

            async function ProblemSubmissionController_getSubmissionByProblem(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProblemSubmissionController_getSubmissionByProblem, request, response });

                const controller = new ProblemSubmissionController();

              await templateService.apiHandler({
                methodName: 'getSubmissionByProblem',
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
        const argsAiSettingsController_getAiSettings: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/settings/ai',
            ...(fetchMiddlewares<RequestHandler>(AiSettingsController)),
            ...(fetchMiddlewares<RequestHandler>(AiSettingsController.prototype.getAiSettings)),

            async function AiSettingsController_getAiSettings(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAiSettingsController_getAiSettings, request, response });

                const controller = new AiSettingsController();

              await templateService.apiHandler({
                methodName: 'getAiSettings',
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
        const argsAiSettingsController_updateAiSettings: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"UpdateAiSettingsRequestDto"},
        };
        app.put('/settings/ai',
            ...(fetchMiddlewares<RequestHandler>(AiSettingsController)),
            ...(fetchMiddlewares<RequestHandler>(AiSettingsController.prototype.updateAiSettings)),

            async function AiSettingsController_updateAiSettings(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAiSettingsController_updateAiSettings, request, response });

                const controller = new AiSettingsController();

              await templateService.apiHandler({
                methodName: 'updateAiSettings',
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
        const argsProblemsController_getAllProblems: Record<string, TsoaRoute.ParameterSchema> = {
                locale: {"in":"query","name":"locale","dataType":"string"},
                strictLocale: {"in":"query","name":"strictLocale","dataType":"boolean"},
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
                locale: {"in":"query","name":"locale","dataType":"string"},
                strictLocale: {"in":"query","name":"strictLocale","dataType":"boolean"},
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
        app.get('/languages',
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
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLanguageController_get: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"double"},
        };
        app.get('/languages/:id',
            ...(fetchMiddlewares<RequestHandler>(LanguageController)),
            ...(fetchMiddlewares<RequestHandler>(LanguageController.prototype.get)),

            async function LanguageController_get(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLanguageController_get, request, response });

                const controller = new LanguageController();

              await templateService.apiHandler({
                methodName: 'get',
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
        const argsLanguageController_create: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"CreateLanguageRequestDto"},
        };
        app.post('/languages',
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
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLanguageController_update: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"double"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateLanguageRequestDto"},
        };
        app.put('/languages/:id',
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
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLanguageController_remove: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"double"},
        };
        app.delete('/languages/:id',
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
                successStatus: 204,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAiController_respond: Record<string, TsoaRoute.ParameterSchema> = {
                dto: {"in":"body","name":"dto","required":true,"ref":"AiRespondRequestDto"},
        };
        app.post('/ai/respond',
            ...(fetchMiddlewares<RequestHandler>(AiController)),
            ...(fetchMiddlewares<RequestHandler>(AiController.prototype.respond)),

            async function AiController_respond(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAiController_respond, request, response });

                const controller = new AiController();

              await templateService.apiHandler({
                methodName: 'respond',
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

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa


    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
