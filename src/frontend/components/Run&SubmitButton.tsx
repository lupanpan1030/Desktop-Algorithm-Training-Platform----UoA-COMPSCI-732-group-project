import React, { useState } from 'react';
import { Button, Box, CircularProgress, Snackbar, Alert, Paper, Typography } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SendIcon from '@mui/icons-material/Send';
import { useApi } from '../hooks/useApi';

interface CodeSubmissionProps {
  problemId: string;
  code: string;
  language: string;
}

const CodeSubmission: React.FC<CodeSubmissionProps> = ({ problemId, code }) => {
  const { fetchData, loading, error } = useApi();
  const [result, setResult] = useState<any>(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [severity, setSeverity] = useState<'success' | 'error' | 'info'>('info');

  // 运行代码
  const handleRunCode = async () => {
    if (!code.trim()) {
      setSnackbarMessage('请先编写代码');
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
      setSnackbarMessage('代码运行完成');
      setSeverity('info');
      setOpenSnackbar(true);
    }
  };

  // 提交代码
  const handleSubmitCode = async () => {
    if (!code.trim()) {
      setSnackbarMessage('请先编写代码');
      setSeverity('error'); 
      setOpenSnackbar(true);
      return;
    }

    const response = await fetchData<any>({
      url: 'localhost:3000//submissions',
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
      setSnackbarMessage(response.accepted ? '提交成功！' : '提交失败');
      setSeverity(response.accepted ? 'success' : 'error');
      setOpenSnackbar(true);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* 按钮组 */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PlayArrowIcon />}
          onClick={handleRunCode}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : '运行代码'}
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={<SendIcon />}
          onClick={handleSubmitCode}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : '提交'}
        </Button>
      </Box>

      

      {/* 错误信息 */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error.message || '操作失败，请稍后重试'}
        </Alert>
      )}

      {/* 通知提示 */}
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