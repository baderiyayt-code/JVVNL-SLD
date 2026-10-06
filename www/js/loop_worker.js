/* --- js/loop_worker.js --- */
self.onmessage = function(e) {
    const { lines, poles, dts, gssNodes, feeder, networkType } = e.data;
    if (!lines || !poles) { self.postMessage({ hasLoop: false, message: "Valid" }); return; }

    const activeNodes = new Set();
    if (feeder && feeder.parentGss) activeNodes.add('GSS_' + feeder.parentGss);
    Object.keys(gssNodes || {}).forEach(gCode => activeNodes.add('GSS_' + gCode));
    (poles || []).forEach(p => { activeNodes.add('POLE_' + p.poleNo); activeNodes.add(p.id); });
    (dts || []).forEach(d => { activeNodes.add('DT_' + d.code); activeNodes.add(d.id); });

    const targetLines = lines.filter(l => {
        const isLT = l.type && l.type.includes('LT');
        const matchesType = (networkType === 'LT' ? isLT : !isLT);
        return matchesType && activeNodes.has(l.fromNode) && activeNodes.has(l.toNode);
    });

    if (targetLines.length === 0) { self.postMessage({ hasLoop: false, message: "No lines to check" }); return; }

    const adjList = {};
    targetLines.forEach(l => {
        if (!adjList[l.fromNode]) adjList[l.fromNode] = [];
        if (!adjList[l.toNode]) adjList[l.toNode] = [];
        adjList[l.fromNode].push(l.toNode);
        adjList[l.toNode].push(l.fromNode);
    });

    let visited = new Set(), parentMap = {}, loopDetected = false;
    function dfs(node, parent) {
        visited.add(node); parentMap[node] = parent;
        for (let neighbor of (adjList[node] || [])) {
            if (!visited.has(neighbor)) { if (dfs(neighbor, node)) return true; } 
            else if (neighbor !== parent) { loopDetected = true; return true; }
        }
        return false;
    }
    for (let node of Object.keys(adjList)) { if (!visited.has(node)) { if (dfs(node, null)) break; } }
    if (loopDetected) self.postMessage({ hasLoop: true, message: "⚠️ Invalid connection! This creates a closed loop." });
    else self.postMessage({ hasLoop: false, message: "Network is clean." });
};
