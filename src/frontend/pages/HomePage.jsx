import React from 'react';
import { useState, useEffect } from 'react';

import ProblemList from '../components/ProblemList';

export default function HomePage() {
    const[problems, setProblems] = useState([]);

    useEffect(() => {
        async function fetchData() {
            const response = await fetch('http://localhost:6785/problems');
            const data = await response.json();
            setProblems(data);
        }
        fetchData();

    }, [])
    
    return (
        <>
            <ProblemList problems={problems} />
        </>
    );
}