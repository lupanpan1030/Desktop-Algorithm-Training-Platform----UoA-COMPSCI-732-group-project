import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import CodeSubmission from '../../frontend/components/Run&SubmitButton';
import { afterEach, describe,  expect,  test } from 'vitest';

const mock = new MockAdapter(axios);

afterEach(() => {
    cleanup();
    mock.reset();
});

describe("Run Button", () => {
  //test run result
    test('Show run result', async () => {
        mock.onPost('/api/run-code')
            .reply(200, {
                status: 'success',
                output: 'Hello World!',
                executionTime: 120,
                memoryUsage: 15
        });
        
        render(<CodeSubmission code="console.log('Hello World!')" problemId={1}/>);
    
        // Click the run button
        fireEvent.click(screen.getByText('Run'));
        
        // show result
        await waitFor(() => {
          expect(screen.getByText('Hello World!')).exist;
          expect(screen.getByText(/excute time: 120 ms/)).exist;
        });
      });

})


describe("Submit Button", () => {
  //test submit result
  test('Submit Button', async () => {
    mock.onPost('localhost://submissions').reply(200, {
      passedTestCases: 10,
      totalTestCases: 10,
      executionTime: 150,
    });

    render(<CodeSubmission code="function solution(n) { return n*2; }" problemId={1} />);

    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      const passed = screen.queryByText('Past case: 10/10');
      expect(passed).exist;
    });
  });

describe("None input", () => {
  test('None input', () => {
    render(<CodeSubmission code="" problemId={9} />);
    
    fireEvent.click(screen.getByText('Run'));
    
    expect(screen.getByText('Please set your code!')).exist;
  });
})

describe("Excute error", () => {
  test('Error', async () => {
    mock.onPost('/api/run-code').reply(500);

    render(<CodeSubmission code="console.log('test')" problemId={8} />);
    
    fireEvent.click(screen.getByText('Run'));
    
    // 等待并验证错误信息显示
    await waitFor(() => {
      expect(screen.getByText(/Failed/)).exist;
    });
  });
})

})