import React, { useState } from 'react';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

export default function Result({ code, language }) {
    const [isRunning, setIsRunning] = useState(false);
    const [output, setOutput] = useState('');

    const handleRunCode = async () => {
        if (!code || code.trim() === '') {
            setOutput('Please write some code first');
            return;
        }

        setIsRunning(true);
        
        try {
            // 模拟API调用，等待后端连接
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 简单模拟一些输出结果
            setOutput(`Running ${language} code...\n\n// 输出结果:\nHello, World!\n\n// 当后端API可用时，这里将显示真实执行结果`);
        } catch (error) {
            console.error('Error running code:', error);
            setOutput(`Error: ${error.message || 'Failed to run code'}`);
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Output</Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PlayArrowIcon />}
                    onClick={handleRunCode}
                    disabled={isRunning || !code}
                >
                    Run
                </Button>
            </Box>

            <Box sx={{ 
                flex: 1, 
                overflow: 'auto',
                border: '1px solid rgba(0, 0, 0, 0.12)',
                borderRadius: 1,
                p: 2,
                fontFamily: 'monospace',
                fontSize: '14px',
                bgcolor: 'background.paper'
            }}>
                {isRunning ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <CircularProgress size={24} sx={{ mr: 2 }}/>
                        <Typography>Running code...</Typography>
                    </Box>
                ) : output ? (
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{output}</pre>
                ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'text.secondary' }}>
                        <Typography>Write some code and press Run to see the output</Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
}