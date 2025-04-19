/**
 * Error handling utilities for Printify MCP
 */

/**
 * Format an error response for tool output
 */
export function formatErrorResponse(
  error: any,
  step: string,
  context: Record<string, any> = {},
  tips: string[] = []
) {
  // Get error details
  const errorType = error.constructor.name;
  const errorMessage = error.message || 'Unknown error';
  const errorStack = error.stack ? error.stack.split('\n').slice(0, 3).join('\n') : 'Not available';
  
  // Format the error message
  let text = `❌ **Error in ${step}**\n\n`;
  
  // Add context information
  Object.entries(context).forEach(([key, value]) => {
    if (typeof value === 'string' && value.includes('"')) {
      text += `- **${key}**: ${value}\n`;
    } else if (typeof value === 'object') {
      text += `- **${key}**: ${JSON.stringify(value)}\n`;
    } else {
      text += `- **${key}**: "${value}"\n`;
    }
  });
  
  text += `- **Error**: ${errorMessage}\n\n`;
  
  // Add detailed diagnostic information
  text += `=== DETAILED DIAGNOSTIC INFORMATION ===\n\n`;
  text += `- **Error Type**: ${errorType}\n`;
  text += `- **Error Stack**: ${errorStack}\n`;
  
  // Add additional context details
  Object.entries(context).forEach(([key, value]) => {
    if (key !== 'Prompt' && key !== 'Model' && key !== 'Error') {
      if (typeof value === 'object' && value !== null) {
        text += `- **${key}**: ${JSON.stringify(value, null, 2)}\n`;
      } else if (value !== undefined && value !== null) {
        text += `- **${key}**: ${value}\n`;
      }
    }
  });
  
  // Add system information
  text += `- **Current Working Directory**: ${process.cwd()}\n`;
  text += `- **Node.js Version**: ${process.version}\n`;
  text += `- **Platform**: ${process.platform}\n\n`;
  
  // Add API response data if available
  if (error.response) {
    text += `- **API Response Status**: ${error.response.status}\n`;
    text += `- **API Response Data**: ${JSON.stringify(error.response.data, null, 2)}\n\n`;
  }
  
  // Add tips if provided
  if (tips.length > 0) {
    text += `\n🔄 Please try again with a different prompt or parameters.\n\n`;
    text += '💡 **Tips**:\n';
    tips.forEach(tip => {
      text += `• ${tip}\n`;
    });
  }
  
  return {
    content: [{ type: "text", text }],
    isError: true
  };
}

/**
 * Format a success response for tool output
 */
export function formatSuccessResponse(
  title: string,
  data: Record<string, any> = {},
  additionalText: string = ''
) {
  let text = `✅ **${title}**\n\n`;
  
  // Add data information
  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'string' && value.includes('"')) {
      text += `- **${key}**: ${value}\n`;
    } else if (typeof value === 'object') {
      text += `- **${key}**: ${JSON.stringify(value)}\n`;
    } else {
      text += `- **${key}**: "${value}"\n`;
    }
  });
  
  // Add additional text if provided
  if (additionalText) {
    text += `\n${additionalText}`;
  }
  
  return {
    content: [{ type: "text", text }]
  };
}
