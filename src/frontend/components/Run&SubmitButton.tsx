import React, { useState } from 'react';
import { Button, Box, CircularProgress, Snackbar, Alert, Paper, Typography } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SendIcon from '@mui/icons-material/Send';
import { useApi } from '../hooks/useApi';

interface CodeSubmissionProps {
  problemId: number;
  code: string;
  languageId: number; 
}

interface TestResult {
  status: string;
  output?: string;
  runtimeMs: number;
  memoryKb: number;
}

interface RunResponse {
  status: string;
  results: TestResult[];
}

interface SubmitResponse {
  submissionId: number;
  overallStatus: string;
  results: TestResult[];
}

const CodeSubmission: React.FC<CodeSubmissionProps> = ({ problemId, code, languageId }) => {
  const { fetchData, loading, error } = useApi();
  //const [result, setResult] = useState<any>(null);
  const [runResults, setRunResults] = useState<RunResponse | null>(null);
  const [submitResults, setSubmitResults] = useState<SubmitResponse | null>(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [severity, setSeverity] = useState<'success' | 'error' | 'info'>('info');

  // run
  const handleRunCode = async () => {
    if (!code.trim()) {
      setSnackbarMessage('Please set your code!');
      setSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    const response = await fetchData<RunResponse>({
      url: `http://localhost:6785/docs/problems/${problemId}/run`,
      method: 'POST',
      body: {
        code,  
        languageId     
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response) {
      setRunResults(response);
      setSnackbarMessage('sucess');
      setSeverity('info');
      setOpenSnackbar(true);
    }
  };

  // submit
  const handleSubmitCode = async () => {
    if (!code.trim()) {
      setSnackbarMessage('Please set your code!');
      setSeverity('error'); 
      setOpenSnackbar(true);
      return;
    }

    const response = await fetchData<SubmitResponse>({
      url: `http://localhost:6785/docs/problems/${problemId}/submit`,
      method: 'POST',
      body: {
        code,
        languageId        
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response) {
      setSubmitResults(response);
      setSnackbarMessage('success！');
      setSeverity('info');
      setOpenSnackbar(true);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* button */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PlayArrowIcon />}
          onClick={handleRunCode}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Run'}
        </Button>

        <Button
          variant="contained"
          color="success"
          startIcon={<SendIcon />}
          onClick={handleSubmitCode}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Submit'}
        </Button>
      </Box>

      {/* result */}
      {runResults && (
        <Paper elevation={3} sx={{ p: 2, mb: 2, bgcolor: '#f0f7ff' }}>
        <Typography variant="h6" gutterBottom>
          Run Results
        </Typography>
        {runResults?.results.map((test, index) => (
          <Box key={index} sx={{ mb: 1 }}>
            <Typography variant="body2">Status: {test.status}</Typography>
            {test.output && (
              <Typography variant="body2">Output: {test.output}</Typography>
            )}
            <Typography variant="body2">Runtime: {test.runtimeMs} ms</Typography>
            <Typography variant="body2">Memory: {test.memoryKb} KB</Typography>
            <hr />
          </Box>
          
        ))}
        </Paper>
      )}

      {submitResults && (
        <Paper elevation={3} sx={{ p: 2, mb: 2, bgcolor: submitResults.overallStatus === 'Accepted' ? '#e6ffe6' : '#fff0f0' }}>
          <Typography variant="h6" gutterBottom>
            Submit Results
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Overall Status: {submitResults.overallStatus}
          </Typography>
          {submitResults.results.map((test, index) => (
            <Box key={index} sx={{ mb: 1 }}>
              <Typography variant="body2">Status: {test.status}</Typography>
              {test.output && (
                <Typography variant="body2">Output: {test.output}</Typography>
              )}
              <Typography variant="body2">Runtime: {test.runtimeMs} ms</Typography>
              <Typography variant="body2">Memory: {test.memoryKb} KB</Typography>
              <hr />
            </Box>
          ))}
        </Paper>
      )}



      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed: {error.message || 'Try later!'}
        </Alert>
      )}

      {/* Notification */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={severity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CodeSubmission;