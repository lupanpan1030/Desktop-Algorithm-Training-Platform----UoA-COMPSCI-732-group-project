import React from "react";

export default function ProblemContent({problem}) {
    return (
        <>
            <h1>Content</h1>
            <p>{problem.title}</p>
        </>
    );
}