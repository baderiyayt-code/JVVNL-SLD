/* --- js/loop_worker.js --- */
// यह फाइल बैकग्राउंड थ्रेड में बिना UI को रोके भारी DFS कैलकुलेशन करेगी

self.onmessage = function(e) {
    const { lines, poles, dts, gssNodes, feeder, networkType } = e.data;

    if (!lines || !poles) {
        self.postMessage({ hasLoop: false, message: "Valid" });
        return;
    }

    const activeNodes = new Set();
    if (feeder && feeder.parentGss) {
        activeNodes.add('GSS_' + feeder.parentGss);
    }
    Object.keys(gssNodes || {}).forEach(gCode => activeNodes.add('GSS_' + gCode));

    (poles || []).forEach(p => {
        activeNodes.add('POLE_' + p.poleNo);
        activeNodes.add(p.id);
    });

    (dts || []).forEach(d => {
        activeNodes.add('DT_' + d.code);
        activeNodes.add(d.id);
    });

    const targetLines = lines.filter(l => {
        const isLT = l.type && l.type.includes('LT');
        const matchesType = (networkType === 'LT' ? isLT : !isLT);
        const endpointsExist = activeNodes.has(l.fromNode) && activeNodes.has(l.toNode);
        return matchesType && endpointsExist;
    });

    if (targetLines.length === 0) {
        self.postMessage({ hasLoop: false, message: "No lines to check" });
        return;
    }

    const adjList = {};
    targetLines.forEach(l => {
        const u = l.fromNode;
        const v = l.toNode;
        if (!adjList[u]) adjList[u] = [];
        if (!adjList[v]) adjList[v] = [];
        adjList[u].push(v);
        adjList[v].push(u);
    });

    let visited = new Set();
    let parentMap = {};
    let loopDetected = false;

    function dfs(node, parent) {
        visited.add(node);
        parentMap[node] = parent;
        const neighbors = adjList[node] || [];
        for (let neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                if (dfs(neighbor, node)) return true;
            } else if (neighbor !== parent) {
                loopDetected = true;
                return true;
            }
        }
        return false;
    }

    for (let node of Object.keys(adjList)) {
        if (!visited.has(node)) {
            if (dfs(node, null)) break;
        }
    }

    if (loopDetected) {
        self.postMessage({ hasLoop: true, message: "⚠️ Invalid connection! This creates a closed loop." });
    } else {
        self.postMessage({ hasLoop: false, message: "Network is clean." });
    }
};
