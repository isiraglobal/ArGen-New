const vscode = require('vscode');
const https = require('https');
const http = require('http');

let captureSession = null;
let sessionStartTime = null;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	console.log('ArGen Capture extension is now active');

	// Configure API Key command
	const configureDisposable = vscode.commands.registerCommand('argen-capture.configureApiKey', async () => {
		const apiKey = await vscode.window.showInputBox({
			prompt: 'Enter your ArGen company API key',
			placeHolder: 'eg: ag_xxxxxxxxxxxx',
			ignoreFocusOut: true
		});

		if (apiKey) {
			await vscode.workspace.getConfiguration('argenCapture').update('apiKey', apiKey, vscode.ConfigurationTarget.Global);
			vscode.window.showInformationMessage('ArGen API key saved successfully');
		}
	});

	// Capture selection command
	const captureDisposable = vscode.commands.registerCommand('argen-capture.captureSelection', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showWarningMessage('No active editor found');
			return;
		}

		const selection = editor.selection;
		const text = editor.document.getText(selection);
		
		if (!text.trim()) {
			vscode.window.showWarningMessage('No text selected');
			return;
		}

		await captureInteraction({
			type: 'selection',
			content: text,
			language: editor.document.languageId,
			filePath: editor.document.fileName,
			action: 'selected'
		});
	});

	// Auto-capture on paste (detecting AI-generated content patterns)
	context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument(async (event) => {
			const config = vscode.workspace.getConfiguration('argenCapture');
			if (!config.get('autoCapture')) return;
			
			const apiKey = config.get('apiKey');
			if (!apiKey) return;

			for (const change of event.contentChanges) {
				if (change.text && isPotentialAIContent(change.text)) {
					await captureInteraction({
						type: 'insertion',
						content: change.text,
						language: event.document.languageId,
						filePath: event.document.fileName,
						action: 'pasted',
						isPotentialAI: true
					});
				}
			}
		})
	);

	// Session tracking
	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor(() => {
			if (!sessionStartTime) {
				sessionStartTime = new Date();
				captureSession = {
					startTime: sessionStartTime.toISOString(),
					interactions: []
				};
			}
		})
	);

	context.subscriptions.push(configureDisposable);
	context.subscriptions.push(captureDisposable);
}

function isPotentialAIContent(text) {
	// Detect common AI output patterns
	const aiPatterns = [
		/Here's a\s+\w+\s+to\s+(your|help)/i,
		/I'd\s+be\s+happy\s+to\s+(help|assist)/i,
		/Here's\s+(a|an|the)\s+\w+/i,
		/```(?:javascript|typescript|python|java|cpp|c|go|rust|sql|html|css)?\n/,
		/^function\s+\w+\s*\(/m,
		/^const\s+\w+\s*=\s*/m,
		/^import\s+.*\s+from\s+/m
	];
	
	return aiPatterns.some(pattern => pattern.test(text)) && text.length > 50;
}

async function captureInteraction(data) {
	const config = vscode.workspace.getConfiguration('argenCapture');
	const apiKey = config.get('apiKey');
	const apiUrl = config.get('apiUrl') || 'https://argen.isira.club/api';

	if (!apiKey) {
		console.log('ArGen: No API key configured');
		return;
	}

	const interaction = {
		...data,
		timestamp: new Date().toISOString(),
		sessionId: captureSession?.sessionId || generateSessionId(),
		extensionVersion: '1.0.0',
		vscodeVersion: vscode.version
	};

	try {
		const response = await postToArGen(`${apiUrl}/capture/interaction`, {
			apiKey,
			interaction
		});

		console.log('ArGen: Interaction captured successfully', response);
		
		// Add to session
		if (captureSession) {
			captureSession.interactions.push(interaction);
		}
	} catch (error) {
		console.error('ArGen: Failed to capture interaction', error.message);
	}
}

function postToArGen(url, data) {
	return new Promise((resolve, reject) => {
		const jsonData = JSON.stringify(data);
		const urlObj = new URL(url);
		
		const options = {
			hostname: urlObj.hostname,
			path: urlObj.pathname,
			port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Content-Length': Buffer.byteLength(jsonData),
				'User-Agent': 'ArGen-VSCode-Extension/1.0.0'
			}
		};

		const req = (urlObj.protocol === 'https:' ? https : http).request(options, (res) => {
			let responseData = '';
			
			res.on('data', (chunk) => {
				responseData += chunk;
			});
			
			res.on('end', () => {
				if (res.statusCode >= 200 && res.statusCode < 300) {
					try {
						resolve(JSON.parse(responseData));
					} catch {
						resolve({ success: true });
					}
				} else {
					reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
				}
			});
		});

		req.on('error', (error) => {
			reject(error);
		});

		req.write(jsonData);
		req.end();
	});
}

function generateSessionId() {
	return 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function deactivate() {
	console.log('ArGen Capture extension deactivated');
	
	// Send session summary if there were interactions
	if (captureSession && captureSession.interactions.length > 0) {
		captureSession.endTime = new Date().toISOString();
		captureSession.interactionCount = captureSession.interactions.length;
		console.log('ArGen: Session summary', captureSession);
	}
}

module.exports = {
	activate,
	deactivate
};