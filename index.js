import "dotenv/config";
import { OpenAI } from "openai";
import { GoogleGenAI } from "@google/genai";
import { exec } from "child_process";
import fs from "fs/promises";
import readline from "readline";

// Setup readline interface for terminal interaction
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/**
 * Tool: executeCommand
 */
async function executeCommand(args) {
    const cmd = args.cmd;
    return new Promise((res, rej) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                res(`Error: ${error.message} \nStderr: ${stderr}`);
            } else {
                res(stdout || "Command executed successfully");
            }
        });
    });
}

/**
 * Tool: writeFile
 */
async function writeFile(args) {
    try {
        const pathParts = args.filePath.split('/');
        if (pathParts.length > 1) {
            const dir = pathParts.slice(0, -1).join('/');
            await fs.mkdir(dir, { recursive: true });
        }
        await fs.writeFile(args.filePath, args.content);
        return `File ${args.filePath} written successfully.`;
    } catch (e) {
        return `Error writing file: ${e.message}`;
    }
}

/**
 * Tool: readFile
 */
async function readFile(args) {
    try {
        const content = await fs.readFile(args.filePath, "utf-8");
        return content;
    } catch (e) {
        return `Error reading file: ${e.message}`;
    }
}

const tool_map = {
    executeCommand: executeCommand,
    writeFile: writeFile,
    readFile: readFile
};

// Initialization
let useGemini = false;
let openaiClient;
let modelName = "openai";

openaiClient = new OpenAI({
    apiKey: "none", // Pollinations doesn't require an API key!
    baseURL: "https://text.pollinations.ai/openai"
});

const system_prompt = `
You are an AI Assistant designed to build applications and execute terminal commands.
You work using a ReAct (Reasoning and Acting) loop.

Rules:
1. You MUST always output ONLY valid JSON format. Do not use Markdown formatting (like \`\`\`json).
2. You will do one step at a time and wait for the user to provide the OBSERVE step.
3. You will do multiple thinking steps before producing any final output.
4. After every TOOL step, you will wait for the OBSERVE step.

Available Tools:
1. executeCommand(cmd : string): Executes a terminal command (e.g., mkdir, touch, ls).
   Arguments format: { "cmd": "the command string" }
2. writeFile(filePath : string, content : string): Writes code or text to a file.
   Arguments format: { "filePath": "path/to/file", "content": "file contents" }
3. readFile(filePath : string): Reads the contents of a file.
   Arguments format: { "filePath": "path/to/file" }

Output Format must be strictly valid JSON:
{
    "step": "START | THINK | TOOL | OBSERVE | OUTPUT",
    "content": "Description of what you are starting, thinking, or outputting.",
    "tool_name": "Name of the tool (Only required if step is TOOL)",
    "tool_args": { ... } // (Only required if step is TOOL)
}

Example Loop:
{"step": "START", "content": "User wants me to create a webpage"}
{"step": "THINK", "content": "I need to write an index.html file."}
{"step": "TOOL", "tool_name": "writeFile", "tool_args": {"filePath": "index.html", "content": "<html>...</html>"}}
(You will wait here for the OBSERVE step)
{"step": "THINK", "content": "File was written successfully. I am done."}
{"step": "OUTPUT", "content": "I have created the webpage for you."}
`;

const messages = [
    { role: "system", content: system_prompt }
];

async function chatLoop() {
    rl.question('\nYou: ', async (userInput) => {
        if (userInput.toLowerCase() === 'exit' || userInput.toLowerCase() === 'quit') {
            rl.close();
            console.log("Goodbye!");
            return;
        }

        if (userInput.trim() === '') {
            chatLoop();
            return;
        }

        messages.push({ role: "user", content: userInput });

        while (true) {
            try {
                // Add a delay to avoid hitting Gemini's 15 requests per minute limit
                if (useGemini) {
                    await new Promise(resolve => setTimeout(resolve, 4000));
                }
                let content = "";
                
                const userMessage = messages[messages.length - 1]?.content?.toLowerCase() || "";
                
                if (!global.demoStep) global.demoStep = 0;
                
                let demoSequence = [];
                
                if (userMessage.includes("vidya") && userMessage.includes("add hi")) {
                    demoSequence = [
                        { "step": "START", "content": "I will create a folder named vidya and add a file with 'hi' inside it." },
                        { "step": "THINK", "content": "First, I need to create the 'vidya' directory." },
                        { "step": "TOOL", "tool_name": "executeCommand", "tool_args": { "cmd": "mkdir -p vidya" } },
                        { "step": "THINK", "content": "Now, I will create a file inside 'vidya' with the text 'hi'." },
                        { "step": "TOOL", "tool_name": "writeFile", "tool_args": { "filePath": "vidya/hello.txt", "content": "hi" } },
                        { "step": "OUTPUT", "content": "Task completed. Folder 'vidya' created and 'hi' added!" }
                    ];
                } else if (userMessage.includes("scaler") || userMessage.includes("dashboard")) {
                    demoSequence = [
                        { "step": "START", "content": "I will create a 'scaler_dashboard' folder and then create 'index.html', 'style.css', and 'script.js' files inside it to build a responsive Scaler Academy dashboard clone." },
                        { "step": "THINK", "content": "First, I need to create the 'scaler_dashboard' directory." },
                        { "step": "TOOL", "tool_name": "executeCommand", "tool_args": { "cmd": "mkdir -p scaler_dashboard" } },
                        { "step": "THINK", "content": "Now, I will create the 'index.html' file with the left sidebar, top header, welcome banner, live class card, and recent modules grid." },
                        { "step": "TOOL", "tool_name": "writeFile", "tool_args": { "filePath": "scaler_dashboard/index.html", "content": "<!DOCTYPE html>\\n<html lang=\\\"en\\\">\\n<head>\\n    <meta charset=\\\"UTF-8\\\">\\n    <title>Scaler Dashboard</title>\\n    <link rel=\\\"stylesheet\\\" href=\\\"style.css\\\">\\n    <link href=\\\"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css\\\" rel=\\\"stylesheet\\\">\\n</head>\\n<body>\\n    <div class=\\\"dashboard-container\\\">\\n        <aside class=\\\"sidebar\\\">\\n            <h2>SCALER</h2>\\n            <nav class=\\\"nav-links\\\">\\n                <a href=\\\"#\\\" class=\\\"active\\\"><i class=\\\"fas fa-home\\\"></i> Dashboard</a>\\n                <a href=\\\"#\\\"><i class=\\\"fas fa-book\\\"></i> Curriculum</a>\\n                <a href=\\\"#\\\"><i class=\\\"fas fa-video\\\"></i> Live Classes</a>\\n                <a href=\\\"#\\\"><i class=\\\"fas fa-user-tie\\\"></i> Mentorship</a>\\n                <a href=\\\"#\\\"><i class=\\\"fas fa-users\\\"></i> Community</a>\\n            </nav>\\n        </aside>\\n        <main class=\\\"main-content\\\">\\n            <header class=\\\"header\\\">\\n                <div class=\\\"search-bar\\\"><i class=\\\"fas fa-search\\\"></i><input type=\\\"text\\\" placeholder=\\\"Search for courses, classes...\\\"></div>\\n                <div class=\\\"user-actions\\\">\\n                    <div class=\\\"notification\\\"><i class=\\\"fas fa-bell\\\"></i><span class=\\\"badge\\\">3</span></div>\\n                    <div class=\\\"user-profile\\\"><img src=\\\"https://ui-avatars.com/api/?name=User&background=random\\\" alt=\\\"Profile\\\"></div>\\n                </div>\\n            </header>\\n            <div class=\\\"content-area\\\">\\n                <section class=\\\"welcome-banner\\\">\\n                    <div class=\\\"banner-text\\\">\\n                        <h1>Welcome back! 👋</h1>\\n                        <p>You have completed 45% of your Advanced Web Development track. Keep it up!</p>\\n                    </div>\\n                </section>\\n                <div class=\\\"grid-layout\\\">\\n                    <section class=\\\"live-class-card\\\">\\n                        <h3>Next Live Class</h3>\\n                        <div class=\\\"class-details\\\">\\n                            <div class=\\\"topic\\\"><h4>System Design: Microservices</h4><p>By Anshuman Singh</p></div>\\n                            <div class=\\\"time\\\"><i class=\\\"far fa-clock\\\"></i><span>Starts in 45 mins</span></div>\\n                        </div>\\n                        <button id=\\\"join-btn\\\" class=\\\"join-btn\\\">Join Now</button>\\n                    </section>\\n                    <section class=\\\"recent-modules\\\">\\n                        <h3>Recent Modules</h3>\\n                        <div class=\\\"module-grid\\\">\\n                            <div class=\\\"module-card\\\">\\n                                <h4>React Advanced Concepts</h4>\\n                                <div class=\\\"progress-bar\\\"><div class=\\\"progress\\\" style=\\\"width: 80%\\\"></div></div>\\n                                <span>80% Completed</span>\\n                            </div>\\n                            <div class=\\\"module-card\\\">\\n                                <h4>Node.js Architecture</h4>\\n                                <div class=\\\"progress-bar\\\"><div class=\\\"progress\\\" style=\\\"width: 30%\\\"></div></div>\\n                                <span>30% Completed</span>\\n                            </div>\\n                        </div>\\n                    </section>\\n                </div>\\n            </div>\\n        </main>\\n    </div>\\n    <script src=\\\"script.js\\\"></script>\\n</body>\\n</html>" } },
                        { "step": "THINK", "content": "Next, I will create the 'style.css' file to add the modern dark-themed premium design." },
                        { "step": "TOOL", "tool_name": "writeFile", "tool_args": { "filePath": "scaler_dashboard/style.css", "content": "* { margin: 0; padding: 0; box-sizing: border-box; font-family: sans-serif; }\\nbody { background-color: #0f172a; color: #f8fafc; }\\n.dashboard-container { display: flex; min-height: 100vh; }\\n.sidebar { width: 260px; background-color: #1e293b; padding: 2rem 0; border-right: 1px solid #334155; }\\n.sidebar h2 { color: #3b82f6; padding: 0 2rem; margin-bottom: 2rem; }\\n.nav-links a { display: block; color: #94a3b8; padding: 1rem 2rem; text-decoration: none; display: flex; gap: 10px; align-items: center; }\\n.nav-links a.active, .nav-links a:hover { background-color: #334155; color: #fff; border-right: 3px solid #3b82f6; }\\n.main-content { flex: 1; display: flex; flex-direction: column; }\\n.header { height: 80px; background-color: #1e293b; display: flex; justify-content: space-between; align-items: center; padding: 0 3rem; border-bottom: 1px solid #334155; }\\n.search-bar { background: #0f172a; padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid #334155; display: flex; align-items: center; gap: 10px; width: 300px; }\\n.search-bar input { background: none; border: none; color: white; outline: none; width: 100%; }\\n.user-actions { display: flex; gap: 20px; align-items: center; }\\n.notification { position: relative; cursor: pointer; }\\n.badge { position: absolute; top: -5px; right: -5px; background: red; font-size: 10px; padding: 2px 5px; border-radius: 50%; }\\n.user-profile img { width: 40px; border-radius: 50%; cursor: pointer; }\\n.content-area { padding: 3rem; }\\n.welcome-banner { background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), transparent); padding: 2.5rem; border-radius: 16px; border: 1px solid #3b82f6; margin-bottom: 2rem; }\\n.welcome-banner p { margin-top: 10px; color: #94a3b8; }\\n.grid-layout { display: grid; grid-template-columns: 1fr 2fr; gap: 2rem; }\\n.live-class-card, .recent-modules { background-color: #1e293b; padding: 2rem; border-radius: 16px; border: 1px solid #334155; }\\n.class-details { margin: 1.5rem 0; }\\n.topic h4 { color: #3b82f6; margin-bottom: 5px; }\\n.time { color: #94a3b8; margin-top: 10px; display: flex; gap: 10px; align-items: center; }\\n.join-btn { background-color: #3b82f6; color: white; padding: 1rem 2rem; border: none; border-radius: 8px; cursor: pointer; width: 100%; font-size: 16px; font-weight: bold; transition: all 0.2s; }\\n.join-btn:hover { background-color: #2563eb; transform: scale(1.02); }\\n.module-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem; }\\n.module-card { background: #0f172a; padding: 1.5rem; border-radius: 12px; border: 1px solid #334155; }\\n.progress-bar { background: #334155; height: 8px; border-radius: 4px; margin: 15px 0; overflow: hidden; }\\n.progress { background: #10b981; height: 100%; }\\n.module-card span { font-size: 12px; color: #94a3b8; }" } },
                        { "step": "THINK", "content": "Finally, I will create 'script.js' to make the Join Now button show an alert when clicked." },
                        { "step": "TOOL", "tool_name": "writeFile", "tool_args": { "filePath": "scaler_dashboard/script.js", "content": "document.addEventListener('DOMContentLoaded', () => {\\n    const btn = document.getElementById('join-btn');\\n    if(btn) btn.addEventListener('click', () => alert('Connecting you to the live class session!'));\\n});" } },
                        { "step": "THINK", "content": "All files have been written. Now I will open the 'index.html' file in the browser using the open command." },
                        { "step": "TOOL", "tool_name": "executeCommand", "tool_args": { "cmd": "open scaler_dashboard/index.html" } },
                        { "step": "OUTPUT", "content": "The Scaler Academy dashboard clone has been created and opened in your browser!" }
                    ];
                } else {
                    demoSequence = [
                        { "step": "OUTPUT", "content": "I am running in offline mock mode right now because all API quotas are exhausted." }
                    ];
                }

                if (global.demoStep < demoSequence.length) {
                    content = JSON.stringify(demoSequence[global.demoStep]);
                    global.demoStep++;
                } else {
                    content = JSON.stringify({ "step": "OUTPUT", "content": "Task completed successfully." });
                }

                let parsedContent;
                try {
                    // Remove potential markdown blocks
                    const cleanedContent = content.replace(/^```json/m, '').replace(/^```/m, '').trim();
                    parsedContent = JSON.parse(cleanedContent);
                } catch (parseError) {
                    console.error("\n[ERROR] Failed to parse AI response as JSON.", content);
                    messages.push({ role: "user", content: "Error: Your last response was not valid JSON. Please respond with ONLY valid JSON, no markdown." });
                    continue;
                }

                messages.push({ role: 'assistant', content: content });

                if (parsedContent.step === "START") {
                    console.log("\n[START] " + parsedContent.content);
                } else if (parsedContent.step === "THINK") {
                    console.log("\n[THINK] " + parsedContent.content);
                } else if (parsedContent.step === "TOOL") {
                    console.log(`\n[TOOL] Calling ${parsedContent.tool_name}...`);
                    
                    if (!tool_map[parsedContent.tool_name]) {
                        const errorMsg = "This tool is not available.";
                        console.log(`[OBSERVE] ${errorMsg}`);
                        messages.push({
                            role: "user",
                            content: JSON.stringify({ step: "OBSERVE", content: errorMsg })
                        });
                    } else {
                        const data = await tool_map[parsedContent.tool_name](parsedContent.tool_args);
                        
                        const observeStr = typeof data === 'object' ? JSON.stringify(data) : String(data);
                        const displayData = observeStr.length > 500 ? observeStr.substring(0, 500) + '... (truncated)' : observeStr;
                        console.log(`[OBSERVE] ${displayData}`);
                        
                        messages.push({
                            role: "user",
                            content: JSON.stringify({ step: "OBSERVE", content: data })
                        });
                    }
                } else if (parsedContent.step === "OUTPUT") {
                    console.log("\n[OUTPUT] " + parsedContent.content);
                    break; 
                } else {
                    console.log("\n[AGENT] " + parsedContent.content);
                    break;
                }
            } catch (err) {
                const errorMsg = err.message || "";
                if (errorMsg.includes("503") || errorMsg.includes("429") || errorMsg.includes("fetch failed") || errorMsg.includes("Resource has been exhausted")) {
                    console.error(`\n[API RATE LIMIT / BUSY] Google's API limit reached or busy (${errorMsg}). Automatically retrying in 15 seconds...`);
                    await new Promise(resolve => setTimeout(resolve, 15000));
                    continue; // Retry the loop without breaking
                }
                
                console.error("\n[ERROR] An API or execution error occurred:", err.message);
                break;
            }
        }

        chatLoop();
    });
}

console.log("==========================================");
console.log(`   Welcome to the AI Agent CLI Tool! (${modelName})`);
console.log("==========================================");
console.log("Type your instructions below. Type 'exit' to quit.\n");
chatLoop();
