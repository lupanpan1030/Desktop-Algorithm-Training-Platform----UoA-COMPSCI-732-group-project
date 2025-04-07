import React from 'react';
import allProblems from '../problems.json';
import ProblemList from '../components/ProblemList';

export default function HomePage() {
    
    return (
        <>
            <ProblemList problems={allProblems} />
        </>
    );
}