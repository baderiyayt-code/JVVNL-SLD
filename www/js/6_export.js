/* --- js/6_export.js --- */
DiscomApp.Export.downloadFileNative = function(blob, filename) {
    try {
        const nameParts = filename.split('.'); const ext = nameParts.pop(); const baseName = nameParts.join('.');
        const uniqueFilename = `${baseName}_${Date.now()}.${ext}`;
        if (typeof cordova !== 'undefined' && cordova.file && cordova.file.externalRootDirectory) {
            const storageLocation = cordova.file.externalRootDirectory + 'Download/';
            window.resolveLocalFileSystemURL(storageLocation, function(dirEntry) {
                dirEntry.getFile(uniqueFilename, { create: true, exclusive: false }, function(fileEntry) {
                    fileEntry.createWriter(function(fileWriter) { fileWriter.onwriteend = function() { DiscomApp.UI.showToast(`Saved: ${uniqueFilename}`); DiscomApp.UI.closeModal(); }; fileWriter.onerror = function() { DiscomApp.Export.fallbackBrowserDownload(blob, uniqueFilename); }; fileWriter.write(blob); }, function(){ DiscomApp.Export.fallbackBrowserDownload(blob, uniqueFilename); });
                }, function(){ DiscomApp.Export.fallbackBrowserDownload(blob, uniqueFilename); });
            }, function() { DiscomApp.Export.fallbackBrowserDownload(blob, uniqueFilename); });
        } else { DiscomApp.Export.fallbackBrowserDownload(blob, uniqueFilename); }
    } catch(e) { DiscomApp.Export.fallbackBrowserDownload(blob, filename); }
};

DiscomApp.Export.fallbackBrowserDownload = function(blob, filename) {
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = filename; document.body.appendChild(link); link.click(); document.body.removeChild(link); DiscomApp.UI.showToast(`Downloaded: ${filename}`); DiscomApp.UI.closeModal();
};

DiscomApp.Export.generateCadSLDPdf = function() {
    const net = DiscomApp.State.getActiveNetwork(); if(!net) return alert("No active network!");
    if (typeof window.jspdf === 'undefined') return alert("PDF Library loading...");
    try {
        const { jsPDF } = window.jspdf; const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const pageWidth = 297, pageHeight = 210, margin = 10;
        const cw = pageWidth - 2 * margin, ch = pageHeight - 2 * margin;

        doc.setDrawColor(235, 240, 245); doc.setLineWidth(0.2);
        for(let i = margin; i <= pageWidth - margin; i += 5) doc.line(i, margin, i, pageHeight - margin);
        for(let j = margin; j <= pageHeight - margin; j += 5) doc.line(margin, j, pageWidth - margin, j);
        doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.5); doc.rect(margin, margin, cw, ch);

        const fName = (net.feeder && net.feeder.name) ? net.feeder.name : 'UNNAMED FEEDER';
        doc.setFontSize(10); doc.setTextColor(0, 0, 0);
        doc.text(`SLD: ${fName.toUpperCase()} (DISCOM PRO)`, margin + 2, margin + 5);

        let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity, nodes = [];
        const pGss = (net.feeder && net.feeder.parentGss) ? DiscomApp.State.gssNodes[net.feeder.parentGss] : null;
        if(pGss) nodes.push({id: 'GSS_'+pGss.code, type: 'GSS', lat: pGss.lat, lng: pGss.lng, data: pGss});
        (net.poles||[]).forEach(p => { if(!isNaN(p.lat) && p.lineType !== 'LT') nodes.push({id: 'POLE_'+p.poleNo, type: 'POLE', lat: p.lat, lng: p.lng, data: p}); });
        
        let poleDTMap = {};
        (net.dts||[]).forEach(d => {
            if(!isNaN(d.lat)) {
                if(d.parentPole) { if(!poleDTMap[String(d.parentPole)]) poleDTMap[String(d.parentPole)] = []; poleDTMap[String(d.parentPole)].push(d); } 
                else { nodes.push({id: 'DT_'+d.code, type: 'DT', lat: d.lat, lng: d.lng, data: d}); }
            }
        });

        if(nodes.length === 0) return alert("No network elements to draw!");
        nodes.forEach(n => { if(n.lat < minLat) minLat = n.lat; if(n.lat > maxLat) maxLat = n.lat; if(n.lng < minLng) minLng = n.lng; if(n.lng > maxLng) maxLng = n.lng; });
        if(maxLat === minLat) { maxLat += 0.001; minLat -= 0.001; } if(maxLng === minLng) { maxLng += 0.001; minLng -= 0.001; }
        
        const padLat = (maxLat - minLat) * 0.1; const padLng = (maxLng - minLng) * 0.1;
        minLat -= padLat; maxLat += padLat; minLng -= padLng; maxLng += padLng;
        
        const cosLat = Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180));
        const dLat = maxLat - minLat; const dLng = (maxLng - minLng) * cosLat; 
        const scale = Math.min(cw / dLng, ch / dLat);
        const usedWidth = dLng * scale, usedHeight = dLat * scale;
        const xOffset = margin + (cw - usedWidth) / 2, yOffset = margin + (ch - usedHeight) / 2;

        const mapToPdf = (lat, lng) => ({ x: xOffset + (((lng - minLng) * cosLat) * scale), y: yOffset + ch - ((lat - minLat) * scale) });

        let totalHT = 0;
        (net.lines||[]).forEach(l => {
            const spec = DiscomApp.Map.getLineSpec(l.type, l.phase, l.conductor);
            if(spec.name.includes('LT')) return; 
            totalHT += (l.distanceMeters || 0);
            const n1 = DiscomApp.Map.getNodeCoords(l.fromNode), n2 = DiscomApp.Map.getNodeCoords(l.toNode);
            if(n1 && n2 && !isNaN(n1.lat) && !isNaN(n2.lat)) {
                const p1 = mapToPdf(n1.lat, n1.lng), p2 = mapToPdf(n2.lat, n2.lng);
                doc.setDrawColor(37, 99, 235); doc.setLineWidth(0.6); doc.line(p1.x, p1.y, p2.x, p2.y);
            }
        });

        nodes.forEach(n => {
            const pos = mapToPdf(n.lat, n.lng);
            if(n.type === 'GSS') { doc.setFillColor(220, 38, 38); doc.rect(pos.x - 3, pos.y - 2, 6, 4, 'FD'); } 
            else if(n.type === 'DT') { doc.setFillColor(249, 115, 22); doc.rect(pos.x - 0.75, pos.y - 0.75, 1.5, 1.5, 'FD'); } 
            else if(n.type === 'POLE') { doc.setFillColor(100, 116, 139); doc.circle(pos.x, pos.y, 0.5, 'F'); }
        });

        const pdfBlob = doc.output('blob');
        DiscomApp.Export.downloadFileNative(pdfBlob, `${fName.replace(/\s+/g, '_')}_SLD.pdf`);
    } catch(err) { alert("PDF Error: " + err.message); }
};

DiscomApp.Export.exportFullJSONBackup = function() { const dataStr = JSON.stringify(DiscomApp.State, null, 2); const blob = new Blob([dataStr], {type: "application/json"}); DiscomApp.Export.downloadFileNative(blob, `Backup_${new Date().getTime()}.json`); };
DiscomApp.Export.handleImportChoice = function(e) {
    const file = e.target.files[0]; if(!file) return; const reader = new FileReader();
    reader.onload = function(ev) { 
        try { 
            const importedData = JSON.parse(ev.target.result); 
            if(!importedData.feeders) return alert("Invalid File!"); 
            if(importedData.feeders) DiscomApp.State.feeders = importedData.feeders;
            if(importedData.gssNodes) DiscomApp.State.gssNodes = importedData.gssNodes;
            DiscomApp.DB.triggerPersistence(); DiscomApp.Map.renderEntireNetwork(); alert("Backup Restored!"); DiscomApp.UI.closeModal(); 
        } catch(err) { alert("Error parsing file!"); } 
    };
    reader.readAsText(file);
};
