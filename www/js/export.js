const Export = {
    
    // JSON Full Backup
    async generateJSON() {
        const backup = { nodes: [], lines: [] };
        await db.nodes.iterate((v) => backup.nodes.push(v));
        await db.lines.iterate((v) => backup.lines.push(v));
        
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
        this.downloadFile(blob, `Survey_Backup_${Date.now()}.json`);
    },

    // CSV Data Export
    async generateCSV() {
        let csv = "ID,Type,Lat,Lng,FeederID\n";
        await db.nodes.iterate((v) => {
            if(!v.deleted) {
                csv += `${v.id},${v.type},${v.lat},${v.lng},${v.feeder_id}\n`;
            }
        });
        const blob = new Blob([csv], { type: "text/csv" });
        this.downloadFile(blob, `Survey_Data_${Date.now()}.csv`);
    },

    // KML Google Earth Export
    async generateKML() {
        let kml = `<?xml version="1.0" encoding="UTF-8"?>
        <kml xmlns="http://www.opengis.net/kml/2.2">
        <Document>
            <name>DISCOM GIS Survey</name>`;
        
        await db.nodes.iterate((v) => {
            if(!v.deleted) {
                kml += `
                <Placemark>
                    <name>${v.type} - ${v.id}</name>
                    <Point>
                        <coordinates>${v.lng},${v.lat},0</coordinates>
                    </Point>
                </Placemark>`;
            }
        });

        kml += `</Document></kml>`;
        const blob = new Blob([kml], { type: "application/vnd.google-earth.kml+xml" });
        this.downloadFile(blob, `Survey_Map_${Date.now()}.kml`);
    },

    // SLD PDF Generation Architecture (jsPDF)
    // Generating a routed SLD requires complex algorithmic tree routing. 
    // This is the stub architecture utilizing jspdf canvas.
    generateSLDPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape' });
        doc.text("Single Line Diagram (SLD) - Feeder F1", 10, 10);
        // Map logical relationships and draw doc.line() and doc.circle()
        doc.save(`SLD_${Date.now()}.pdf`);
    },

    // File Downloader helper
    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};
