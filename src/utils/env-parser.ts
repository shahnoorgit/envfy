/**
 * Parse .env file content into a key-value object.
 * 
 * Supports:
 * - KEY=value format
 * - Quoted values (single and double quotes)
 * - Comments (lines starting with #)
 * - Empty lines
 * - Multiline values with quotes
 * - Special characters in values
 * - Export prefix (export KEY=value)
 */

export interface ParsedEnv {
  [key: string]: string;
}

export interface ParseResult {
  env: ParsedEnv;
  count: number;
  keys: string[];
}

/**
 * Parse .env file content into a key-value object
 */
export function parseEnvContent(content: string): ParseResult {
  const env: ParsedEnv = {};
  const keys: string[] = [];
  
  const lines = content.split("\n");
  let currentKey: string | null = null;
  let currentValue: string = "";
  let inMultilineValue = false;
  let quoteChar: string | null = null;

  for (const line of lines) {
    // If we're in a multiline value, append to current value
    if (inMultilineValue && currentKey) {
      // Check if this line ends the multiline value
      if (quoteChar && line.includes(quoteChar)) {
        const endIndex = line.indexOf(quoteChar);
        currentValue += "\n" + line.slice(0, endIndex);
        env[currentKey] = currentValue;
        keys.push(currentKey);
        currentKey = null;
        currentValue = "";
        inMultilineValue = false;
        quoteChar = null;
      } else {
        currentValue += "\n" + line;
      }
      continue;
    }

    // Skip empty lines
    if (!line.trim()) {
      continue;
    }

    // Skip comments
    if (line.trim().startsWith("#")) {
      continue;
    }

    // Parse KEY=VALUE
    const parsed = parseLine(line);
    if (parsed) {
      const { key, value, isMultiline, quote } = parsed;
      
      if (isMultiline) {
        currentKey = key;
        currentValue = value;
        inMultilineValue = true;
        quoteChar = quote;
      } else {
        env[key] = value;
        keys.push(key);
      }
    }
  }

  // Handle unclosed multiline value (shouldn't happen but be safe)
  if (currentKey && inMultilineValue) {
    env[currentKey] = currentValue;
    keys.push(currentKey);
  }

  return {
    env,
    count: keys.length,
    keys,
  };
}

interface ParsedLine {
  key: string;
  value: string;
  isMultiline: boolean;
  quote: string | null;
}

/**
 * Parse a single line of .env file
 */
function parseLine(line: string): ParsedLine | null {
  // Remove 'export ' prefix if present
  let processedLine = line.trim();
  if (processedLine.startsWith("export ")) {
    processedLine = processedLine.slice(7);
  }

  // Find the first = sign
  const equalsIndex = processedLine.indexOf("=");
  if (equalsIndex === -1) {
    return null;
  }

  const key = processedLine.slice(0, equalsIndex).trim();
  let value = processedLine.slice(equalsIndex + 1);

  // Validate key (alphanumeric and underscore only)
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
    return null;
  }

  // Handle quoted values
  const trimmedValue = value.trim();
  
  // Double-quoted value
  if (trimmedValue.startsWith('"')) {
    const content = trimmedValue.slice(1);
    const endQuoteIndex = findClosingQuote(content, '"');
    
    if (endQuoteIndex === -1) {
      // Multiline value - quote not closed on this line
      return {
        key,
        value: content,
        isMultiline: true,
        quote: '"',
      };
    }
    
    // Complete quoted value
    return {
      key,
      value: unescapeValue(content.slice(0, endQuoteIndex)),
      isMultiline: false,
      quote: null,
    };
  }
  
  // Single-quoted value
  if (trimmedValue.startsWith("'")) {
    const content = trimmedValue.slice(1);
    const endQuoteIndex = findClosingQuote(content, "'");
    
    if (endQuoteIndex === -1) {
      // Multiline value - quote not closed on this line
      return {
        key,
        value: content,
        isMultiline: true,
        quote: "'",
      };
    }
    
    // Complete quoted value (single quotes = literal, no escape processing)
    return {
      key,
      value: content.slice(0, endQuoteIndex),
      isMultiline: false,
      quote: null,
    };
  }

  // Unquoted value - trim and remove inline comments
  const commentIndex = value.indexOf(" #");
  if (commentIndex !== -1) {
    value = value.slice(0, commentIndex);
  }

  return {
    key,
    value: value.trim(),
    isMultiline: false,
    quote: null,
  };
}

/**
 * Find the closing quote, accounting for escaped quotes
 */
function findClosingQuote(str: string, quote: string): number {
  let i = 0;
  while (i < str.length) {
    if (str[i] === "\\") {
      // Skip escaped character
      i += 2;
      continue;
    }
    if (str[i] === quote) {
      return i;
    }
    i++;
  }
  return -1;
}

/**
 * Unescape special characters in double-quoted values
 */
function unescapeValue(value: string): string {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

/**
 * Count the number of environment variables in .env content
 * (simpler version for display purposes)
 */
export function countEnvVars(content: string): number {
  return content
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith("#") && trimmed.includes("=");
    })
    .length;
}

