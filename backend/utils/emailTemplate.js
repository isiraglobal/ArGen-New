const createEmailTemplate = ({ title, preheader, bodyContent, buttonText, buttonUrl }) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <!--[if mso]>
    <style>
        body, table, td, h1, h2, h3, p, a { font-family: Arial, sans-serif !important; }
    </style>
    <![endif]-->
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=JetBrains+Mono:wght@400;700&display=swap');
        
        body {
            margin: 0;
            padding: 0;
            background-color: #000000;
            color: #ffffff;
            font-family: 'Inter', Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #0a0a0a;
            border: 1px solid rgba(206, 255, 0, 0.2);
        }
        
        .header {
            padding: 40px 30px;
            text-align: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .logo {
            font-family: 'JetBrains Mono', monospace;
            font-size: 24px;
            font-weight: 700;
            color: #ffffff;
            text-decoration: none;
            letter-spacing: -1px;
        }
        
        .accent {
            color: #ceff00;
        }
        
        .content {
            padding: 40px 30px;
            font-size: 16px;
            line-height: 1.6;
        }
        
        h1 {
            font-family: 'JetBrains Mono', monospace;
            font-size: 24px;
            margin-top: 0;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: -1px;
            color: #ffffff;
        }
        
        p {
            margin-top: 0;
            margin-bottom: 20px;
            color: #cccccc;
        }
        
        .button-container {
            text-align: center;
            margin: 40px 0;
        }
        
        .button {
            display: inline-block;
            padding: 16px 32px;
            background-color: #ceff00;
            color: #000000 !important;
            text-decoration: none;
            font-family: 'JetBrains Mono', monospace;
            font-weight: 700;
            font-size: 16px;
            text-transform: uppercase;
        }
        
        .footer {
            padding: 30px;
            text-align: center;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            background-color: #050505;
        }
        
        .footer p {
            font-size: 12px;
            color: #666666;
            margin-bottom: 10px;
        }
        
        .code-block {
            background-color: #111;
            border: 1px solid #333;
            padding: 20px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 24px;
            text-align: center;
            color: #ceff00;
            letter-spacing: 4px;
            margin: 30px 0;
        }
    </style>
</head>
<body>
    <div style="display: none; max-height: 0px; overflow: hidden;">
        ${preheader || title}
    </div>
    
    <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#000000">
        <tr>
            <td align="center" style="padding: 40px 10px;">
                <table class="container" width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                        <td class="header">
                            <a href="https://argen.isira.club" class="logo">ArGen<span class="accent">.</span></a>
                        </td>
                    </tr>
                    <tr>
                        <td class="content">
                            ${bodyContent}
                            
                            ${buttonText && buttonUrl ? `
                            <div class="button-container">
                                <a href="${buttonUrl}" class="button">${buttonText}</a>
                            </div>
                            ` : ''}
                        </td>
                    </tr>
                    <tr>
                        <td class="footer">
                            <p>ArGen AI Evaluation Platform</p>
                            <p>This is an automated message. Please do not reply directly to this email.</p>
                            <p>&copy; ${new Date().getFullYear()} ArGen. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
};

module.exports = { createEmailTemplate };
