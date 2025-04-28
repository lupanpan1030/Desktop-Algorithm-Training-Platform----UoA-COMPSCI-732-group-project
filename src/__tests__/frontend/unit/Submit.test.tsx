import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import CodeSubmission from '../../../frontend/components/Run&SubmitButton';
import { afterEach, describe,  expect,  test } from 'vitest';

const mock = new MockAdapter(axios);

afterEach(() => {
    cleanup();
    mock.reset();
});

describe("Run Button", () => {
  //test run result
    test('Show run result', async () => {
        mock.onPost('http://localhost:6785/docs/problems/1/run')
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
          expect(screen.getByText(/Output: Hello World!/i)).exist;
          expect(screen.getByText(/Runtime: 100 ms/)).exist;
          expect(screen.getByText(/Memory: 200 KB/)).exist
        });
      });

    })
 


describe("Submit Button", () => {
  //test submit result
  test('Submit Button', async () => {
    mock.onPost('http://localhost:6785/docs/problems/1/submit').reply(200, {
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
      expect(screen.getByText(/Output: 20/)).exist;
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
    mock.onPost('/api/run-code').reply(500);

    render(<CodeSubmission code="console.log('test')" problemId={8} languageId={2}/>);
    
    fireEvent.click(screen.getByText('Run'));
    
    await waitFor(() => {
      expect(screen.getByText(/Failed/)).exist;
    });
  });
})

