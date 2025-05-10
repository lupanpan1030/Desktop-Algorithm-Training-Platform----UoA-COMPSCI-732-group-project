// 引入 Prisma 客户端
// Import Prisma client
import prisma from "../prismaClient";

//批量插入提交结果数据
//Seed multiple submission results
export async function seedSubmissionResults() {
  console.log("Seeded SubmissionResults");
  await prisma.submissionResult.createMany({
    data: [
      {
        submission_id: 1,
        status: "ACCEPTED",
        output: "1",
        runtime_ms: 50,
        memory_kb: 89440,
      },
      {
        submission_id: 1,
        status: "ACCEPTED",
        output: "6765",
        runtime_ms: 15,
        memory_kb: 89728,
      },
      {
        submission_id: 1,
        status: "ACCEPTED",
        output: "3",
        runtime_ms: 14,
        memory_kb: 89584,
      },
      {
        submission_id: 1,
        status: "ACCEPTED",
        output: "2",
        runtime_ms: 16,
        memory_kb: 89520,
      },

      {
        submission_id: 2,
        status: "RUNTIME_ERROR",
        output:
          'Command failed: echo "2 7 11 15\n9" | python /var/folders/l4/gft8dtdx7pn767m_909y0prr0000gp/T/temp_1746539904695.py\n  File "/var/folders/l4/gft8dtdx7pn767m_909y0prr0000gp/T/temp_1746539904695.py", line 1\n    hello world\n          ^^^^^\nSyntaxError: invalid syntax\n',
        runtime_ms: 27,
        memory_kb: 58608,
      },
      {
        submission_id: 2,
        status: "RUNTIME_ERROR",
        output:
          'Command failed: echo "3 3\n6" | python /var/folders/l4/gft8dtdx7pn767m_909y0prr0000gp/T/temp_1746539904695.py\n  File "/var/folders/l4/gft8dtdx7pn767m_909y0prr0000gp/T/temp_1746539904695.py", line 1\n    hello world\n          ^^^^^\nSyntaxError: invalid syntax\n',
        runtime_ms: 17,
        memory_kb: 58800,
      },
      {
        submission_id: 2,
        status: "RUNTIME_ERROR",
        output:
          'Command failed: echo "3 2 4\n6" | python /var/folders/l4/gft8dtdx7pn767m_909y0prr0000gp/T/temp_1746539904695.py\n  File "/var/folders/l4/gft8dtdx7pn767m_909y0prr0000gp/T/temp_1746539904695.py", line 1\n    hello world\n          ^^^^^\nSyntaxError: invalid syntax\n',
        runtime_ms: 19,
        memory_kb: 58688,
      },
      {
        submission_id: 2,
        status: "RUNTIME_ERROR",
        output:
          'Command failed: echo "1 4 7 10 12\n17" | python /var/folders/l4/gft8dtdx7pn767m_909y0prr0000gp/T/temp_1746539904695.py\n  File "/var/folders/l4/gft8dtdx7pn767m_909y0prr0000gp/T/temp_1746539904695.py", line 1\n    hello world\n          ^^^^^\nSyntaxError: invalid syntax\n',
        runtime_ms: 15,
        memory_kb: 59296,
      },
      {
        submission_id: 3,
        status: 'ACCEPTED',
        output: '1->1->2->3->4->4',
        runtime_ms: 30,
        memory_kb: 1024,
        submitted_at: new Date('2025-05-09T10:00:01.000Z'),
      },
      {
        submission_id: 4,
        status: 'ACCEPTED',
        output: '6',
        runtime_ms: 10,
        memory_kb: 512,
        submitted_at: new Date('2025-05-09T10:05:01.000Z'),
      },
      {
        submission_id: 5,
        status: 'ACCEPTED',
        output: '3',
        runtime_ms: 15,
        memory_kb: 600,
        submitted_at: new Date('2025-05-09T10:10:01.000Z'),
      },
    ],
  });
}

export async function clearSubmissionResults() {
  await prisma.submissionResult.deleteMany({});
  console.log("Cleared submission-results");
}
