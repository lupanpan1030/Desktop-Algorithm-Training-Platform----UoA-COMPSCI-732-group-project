import React, { useState } from 'react';
import { Button, Box, CircularProgress, Snackbar, Alert, Paper, Typography } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SendIcon from '@mui/icons-material/Send';
import { useApi } from '../hooks/useApi';
import { useTheme } from '@mui/material/styles';

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
  const { runCode, submitCode, loading, error } = useApi();
  const [runResults, setRunResults] = useState<RunResponse | null>(null);
  const [submitResults, setSubmitResults] = useState<SubmitResponse | null>(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [severity, setSeverity] = useState<'success' | 'error' | 'info'>('info');
  const [activeView, setActiveView] = useState<'run' | 'submit' | null>(null);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // run
  const handleRunCode = async () => {
    if (!code?.trim()) {
      setSnackbarMessage('Please set your code!');
      setSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    console.log('Running code with language ID:', languageId);
    
    const response = await runCode(problemId, code, languageId);
    if (response) {
      setRunResults(response);
      setActiveView('run');
      setSnackbarMessage('success');
      setSeverity('info');
      setOpenSnackbar(true);
    }
  };

  // submit
  const handleSubmitCode = async () => {
    if (!code?.trim()) {
      setSnackbarMessage('Please set your code!');
      setSeverity('error'); 
      setOpenSnackbar(true);
      return;
    }

    console.log('Submitting code with language ID:', languageId);
    
    const response = await submitCode(problemId, code, languageId);
    if (response) {
      setSubmitResults(response);
      setActiveView('submit');
      setSnackbarMessage('success!');
      setSeverity('info');
      setOpenSnackbar(true);

      // Clear saved code after successful submission
      localStorage.removeItem(`editorCode_${problemId}`);
      localStorage.removeItem(`editorLanguage_${problemId}`);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <Box sx={{ width: '100%', display: 'flex', height: '100%', flexDirection: 'column'}}>
      {/* button */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<PlayArrowIcon />}
          onClick={handleRunCode}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Run'}
        </Button>

        <Button
          variant="contained"
          color="secondary"
          startIcon={<SendIcon />}
          onClick={handleSubmitCode}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Submit'}
        </Button>
      </Box>

      {/* result */}
      <Box sx={{flex: 1, overflow: 'hidden', position: 'relative', height: 'calc(100% - 30px)', p: 2}}>
      <Box sx={{overflowY: 'auto', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pb: 2}}>
      {activeView === 'run' && runResults && (
      <>
        <Typography variant="h6" gutterBottom>
          Run Results
        </Typography>
        {runResults.results.map((test, index) => (
          <Paper
            key={index}
            elevation={3}
            sx={{
              p: 2,
              mb: 2,
              bgcolor:
                test.status === 'ACCEPTED'
                  ? (isDark ? '#1b5e20' : '#e8f5e9')    
                  : (isDark ? '#5c0000' : '#ffebee'),
              color: isDark ? '#ffffff' : '#000000'
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Status: {test.status}
            </Typography>
            {test.output && (
              <Typography variant="body2">Output: {test.output}</Typography>
            )}
            <Typography variant="body2">Runtime: {test.runtimeMs} ms</Typography>
            <Typography variant="body2">Memory: {test.memoryKb} KB</Typography>
          </Paper>
        ))}
      </>
    )}

    {activeView === 'submit' && submitResults && (
      <>
        <Typography variant="h6" gutterBottom>
          Submit Results
        </Typography>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold'}}>
          Overall Status:{' '}
          <Box component="span" sx={{ color: submitResults.overallStatus === 'ACCEPTED' ? 'green' : 'red' }}>
            {submitResults.overallStatus}
          </Box>
        </Typography>
        {submitResults.results.map((test, index) => (
          <Paper
            key={index}
            elevation={3}
            sx={{
              p: 2,
              mb: 2,
              bgcolor:
                test.status === 'ACCEPTED'
                  ? (isDark ? '#1b5e20' : '#e8f5e9')    
                  : (isDark ? '#5c0000' : '#ffebee'),  
              color: isDark ? '#ffffff' : '#000000'
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Status: {test.status}
            </Typography>
            {test.output && (
              <Typography variant="body2">Output: {test.output}</Typography>
            )}
            <Typography variant="body2">Runtime: {test.runtimeMs} ms</Typography>
            <Typography variant="body2">Memory: {test.memoryKb} KB</Typography>
          </Paper>
        ))}
      </>
    )}

      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed: {error.message || 'Try later!'}
        </Alert>
      )}
      </Box>
      </Box>

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