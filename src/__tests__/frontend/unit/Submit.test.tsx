import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import CodeSubmission from '../../../frontend/components/Run&SubmitButton';
import { afterEach, describe, expect, test, vi } from 'vitest';
import api from '../../../frontend/api/axiosInstance';

const mock = new MockAdapter(api);

afterEach(() => {
    cleanup();
    mock.reset();
});

describe("Run Button", () => {
  //test run result
    test('Show run result', async () => {
        mock.onPost('/problems/1/run')
            .reply(200, {
                status: 'success',
                results: [
                  {
                    status: 'Passed',
                    output: 'Hello World!',
                    runtimeMs: 100,
                    memoryKb: 200
                  }
                ]
        });
        
        render(<CodeSubmission code="console.log('Hello World!')" problemId={1} languageId={1}/>);
    
        // Click the run button
        fireEvent.click(screen.getByText('Run'));
        
        // show result
        await waitFor(() => {
          expect(screen.getByText((content) => content.includes('Status: Passed'))).exist;
          expect(screen.getByText('Primary Output')).toBeTruthy();
          expect(screen.getByText(/Hello World!/i)).toBeTruthy();
          expect(screen.getByText(/Runtime: 100 ms/)).exist;
          expect(screen.getByText(/Memory: 200 KB/)).exist
        });
      });

    })
 

describe("Submit Button", () => {
  //test submit result
  test('Submit Button', async () => {
    mock.onPost('/problems/1/submit').reply(200, {
      submissionId: 2,
      overallStatus: 'sucess',
      results: [
        {
          status: 'Passed',
          output: '20',
          runtimeMs: 100,
          memoryKb: 200
        }
      ]
    });

    render(<CodeSubmission code="function solution(n) { return n*2; }" problemId={1} languageId={1} />);

    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(screen.getByText((content) => content.includes('Status: Passed'))).exist;
      expect(screen.getByText('Primary Output')).toBeTruthy();
      expect(screen.getByText('20', { selector: 'pre' })).toBeTruthy();
      expect(screen.getByText(/Runtime: 100 ms/)).exist;
      expect(screen.getByText(/Memory: 200 KB/)).exist
    });
  });
})

describe("None input", () => {
  test('None input', () => {
    render(<CodeSubmission code="" problemId={9} languageId={2}/>);
    
    fireEvent.click(screen.getByText('Run'));
    
    expect(screen.getByText('Please set your code!')).exist;
  });
})

describe("Excute error", () => {
  test('Error', async () => {
    mock.onPost('/problems/8/run').reply(500);

    render(<CodeSubmission code="console.log('test')" problemId={8} languageId={2}/>);
    
    fireEvent.click(screen.getByText('Run'));
    
    await waitFor(() => {
      expect(screen.getByText(/Failed/)).exist;
    });
  });
})

describe("Submission history", () => {
  test("loads history details and can restore a submission to the editor", async () => {
    const onRestoreSubmission = vi.fn();

    mock.onGet("/problems/1/submissions").reply(200, [
      {
        submissionId: 2,
        languageId: 1,
        status: "ACCEPTED",
        submittedAt: "2026-04-02T00:00:00.000Z",
      },
    ]);
    mock.onGet("/problems/1/submissions/2").reply(200, {
      submissionId: 2,
      code: "print('ok')",
      languageId: 1,
      status: "ACCEPTED",
      submittedAt: "2026-04-02T00:00:00.000Z",
      results: [
        {
          status: "ACCEPTED",
          output: "ok",
          runtimeMs: 12,
          memoryKb: 64,
        },
      ],
    });

    render(
      <CodeSubmission
        code="print('ok')"
        problemId={1}
        languageId={1}
        languageLabels={{ 1: "Python" }}
        onRestoreSubmission={onRestoreSubmission}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Submission History")).toBeTruthy();
      expect(screen.getAllByText("Submission #2")).toHaveLength(2);
      expect(screen.getByText(/Language: Python/)).toBeTruthy();
      expect(screen.getByText('Primary Output')).toBeTruthy();
      expect(screen.getByText(/^ok$/)).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Load Into Editor" }));

    expect(onRestoreSubmission).toHaveBeenCalledWith(
      expect.objectContaining({
        submissionId: 2,
        code: "print('ok')",
        languageId: 1,
      })
    );
  });
});

describe("Result diagnostics", () => {
  test("renders phase, exit code, timeout and stderr when provided", async () => {
    mock.onGet("/problems/1/submissions").reply(200, []);
    mock.onPost('/problems/1/run')
      .reply(200, {
        status: 'RUNTIME_ERROR',
        results: [
          {
            status: 'RUNTIME_ERROR',
            output: 'Traceback',
            stderr: 'Traceback',
            phase: 'run',
            exitCode: 1,
            timedOut: false,
            runtimeMs: 42,
            memoryKb: 256
          },
          {
            status: 'TIME_LIMIT_EXCEEDED',
            output: 'time limit exceeded',
            stderr: 'time limit exceeded',
            phase: 'run',
            timedOut: true,
            runtimeMs: 50,
            memoryKb: 0
          }
        ]
    });

    render(<CodeSubmission code="print('x')" problemId={1} languageId={1}/>);

    fireEvent.click(screen.getByText('Run'));

    await waitFor(() => {
      expect(screen.getAllByText(/Phase: run/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Exit Code: 1/i)).toBeTruthy();
      expect(screen.getByText(/Timed Out/i)).toBeTruthy();
      expect(screen.getAllByText(/Stderr/i).length).toBeGreaterThan(0);
    });
  });
});
