import fs from 'fs';
import path from 'path';

/**
 * CircleChain Drips Wave Automated GitHub Issue Publisher
 * 
 * Usage:
 *   export GITHUB_TOKEN="your_personal_access_token"
 *   npx ts-node scripts/publish-drips-issues.ts <owner> <repo>
 */

async function publishToGitHub() {
  const args = process.argv.slice(2);
  const owner = args[0] || 'trustpay-escrow';
  const repo = args[1] || 'circle-chain';

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('❌ Error: Please set the GITHUB_TOKEN environment variable.');
    console.error('Example: $env:GITHUB_TOKEN="ghp_xxxx"; npx ts-node scripts/publish-drips-issues.ts trustpay-escrow circle-chain');
    process.exit(1);
  }

  const issuesPath = path.join(__dirname, '../docs/drips-wave-issues.json');
  if (!fs.existsSync(issuesPath)) {
    console.error(`❌ Error: Issues file not found at ${issuesPath}`);
    process.exit(1);
  }

  const issues = JSON.parse(fs.readFileSync(issuesPath, 'utf-8'));
  console.log(`🚀 Publishing ${issues.length} Drips Wave Engineering Issues to GitHub repo: ${owner}/${repo}...\n`);

  let publishedCount = 0;

  for (const issue of issues) {
    const dripsPoints = issue.complexity === 'High' ? 200 : issue.complexity === 'Medium' ? 150 : 100;
    
    const body = `## 📌 Summary
${issue.summary}

### 🌊 Drips Wave Classification
- **Domain Layer:** \`${issue.domain}\`
- **Complexity:** \`${issue.complexity}\`
- **Drips Value:** **${dripsPoints} Points**

### 💡 Proposed Solution
${issue.proposedSolution}

### ✅ Acceptance Criteria
${issue.acceptanceCriteria.map((c: string) => `- [ ] ${c}`).join('\n')}

---
*Published via CircleChain Drips Wave Automated Maintainer Blueprint.*
`;

    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'CircleChain-Drips-Publisher'
        },
        body: JSON.stringify({
          title: issue.title,
          body,
          labels: [...(issue.labels || []), `complexity:${issue.complexity.toLowerCase()}`, `${dripsPoints}-pts`]
        })
      });

      if (response.ok) {
        const resData = await response.json();
        publishedCount++;
        console.log(`✅ [${publishedCount}/${issues.length}] Published Issue #${resData.number}: "${issue.title}" (${dripsPoints} Pts)`);
      } else {
        const errText = await response.text();
        console.warn(`⚠️ Failed to publish "${issue.title}":`, errText);
      }
    } catch (err: any) {
      console.error(`❌ Error publishing "${issue.title}":`, err?.message || err);
    }

    // Throttle to respect GitHub API rate limits
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`\n🎉 Completed! Successfully published ${publishedCount} / ${issues.length} Drips Wave issues to ${owner}/${repo}.`);
}

publishToGitHub().catch(console.error);
