import React, { useState } from 'react';
import { Button, Box, CircularProgress, Snackbar, Alert, Paper, Typography } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SendIcon from '@mui/icons-material/Send';
import { useApi } from '../hooks/useApi';

interface CodeSubmissionProps {
  problemId: number;
  code: string;
}

const CodeSubmission: React.FC<CodeSubmissionProps> = ({ problemId, code }) => {
  const { fetchData, loading, error } = useApi();
  const [result, setResult] = useState<any>(null);
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

    const response = await fetchData<any>({
      url: '/api/run-code',
      method: 'POST',
      body: {
        problemId,
        code,       
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response) {
      setResult(response);
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

    const response = await fetchData<any>({
      url: 'localhost://submissions',
      method: 'POST',
      body: {
        problemId,
        code,
        
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response) {
      setResult(response);
      setSnackbarMessage(response.accepted ? 'sucess！' : 'fail');
      setSeverity(response.accepted ? 'success' : 'error');
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

      {result && (
        <Paper elevation={3} sx={{ p: 2, mb: 2, bgcolor: result.status === 'success' ? '#f0f7ff' : '#fff5f5' }}>
          <Typography variant="h6" gutterBottom>
            Result
          </Typography>
          <Box sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', overflow: 'auto', maxHeight: '300px', p: 1, bgcolor: '#f5f5f5' }}>
            {result.output}
          </Box>
          {result.executionTime && (
            <Typography variant="body2">excute time: {result.executionTime} ms</Typography>
          )}
          {result.passedTestCases !== undefined && result.totalTestCases !== undefined && (
            <Typography variant="body2">
            Past case: {result.passedTestCases}/{result.totalTestCases}
            </Typography>
          )}
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