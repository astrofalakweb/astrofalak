const fs = require('fs');

try {
  const data = fs.readFileSync('public/models/solar_system.glb');
  
  // The JSON chunk is usually near the beginning. Let's find it.
  // "JSON" chunk identifier is 0x4E4F534A
  
  const magic = data.readUInt32LE(0);
  if (magic !== 0x46546C67) {
    console.log("Not a valid glTF 2.0 binary");
    process.exit(1);
  }
  
  const length = data.readUInt32LE(4);
  const chunkLength = data.readUInt32LE(12);
  const chunkType = data.readUInt32LE(16);
  
  if (chunkType === 0x4E4F534A) {
    const jsonStr = data.toString('utf8', 20, 20 + chunkLength);
    const json = JSON.parse(jsonStr);
    const nodes = json.nodes ? json.nodes.map(n => n.name).filter(Boolean) : [];
    console.log("Nodes:", nodes.join(', '));
  } else {
    console.log("JSON chunk not found");
  }
} catch(e) {
  console.error(e);
}
