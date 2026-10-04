const App = {
    map: null,
    layers: {},
    currentPlacementMode: null,
    tempNode: null,
    
    // Zoom Visibility Thresholds
    THRESHOLDS: { GSS: 12, DT: 13, HT_LINE: 14, HT_POLE: 15, LT_LINE: 16, LT_POLE: 17, CONSUMER: 18 },

    // Custom SVGs (Professional Anchor points)
    Icons: {
        HT_POLE: L.divIcon({ className: 'custom-icon', html: `<svg width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="6" fill="#ff0000" stroke="black" stroke-width="2"/></svg>`, iconSize: [20, 20], iconAnchor: [10, 10] }),
        LT_POLE: L.divIcon({ className: 'custom-icon', html: `<svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="5" fill="#00ff00" stroke="black" stroke-width="2"/></svg>`, iconSize: [16, 16], iconAnchor: [8, 8] }),
        DT: L.divIcon({ className: 'custom-icon', html: `<svg width="24" height="24" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" fill="yellow" stroke="black" stroke-width="2"/></svg>`, iconSize: [24, 24], iconAnchor: [12, 12] }),
        CONSUMER: L.divIcon({ className: 'custom-icon', html: `<svg width="14" height="14" viewBox="0 0 14 14"><polygon points="7,0 14,14 0,14" fill="blue"/></svg>`, iconSize: [14, 14], iconAnchor: [7, 14] }) // Anchor bottom for houses
    },

    initMap() {
        if (this.map) return; // Prevent re-init
        
        // Base Map Layers
        const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 22 });
        const googleHybrid = L.tileLayer('http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', { maxZoom: 22, subdomains:['mt0','mt1','mt2','mt3'] });

        this.map = L.map('map', {
            center: [28.6139, 77.2090], // Default coords
            zoom: 15,
            layers: [osmLayer],
            zoomControl: false // Custom controls if needed
        });

        // Layer Groups
        this.layers = {
            GSS: L.layerGroup().addTo(this.map),
            HT_POLE: L.layerGroup().addTo(this.map),
            DT: L.layerGroup().addTo(this.map),
            LT_POLE: L.layerGroup().addTo(this.map),
            CONSUMER: L.layerGroup().addTo(this.map),
            HT_LINE: L.layerGroup().addTo(this.map),
            LT_LINE: L.layerGroup().addTo(this.map)
        };

        L.control.layers({ "OSM": osmLayer, "Google Hybrid": googleHybrid }).addTo(this.map);

        // Prevent UI clicks from moving map
        document.querySelectorAll('.disable-click').forEach(el => {
            L.DomEvent.disableClickPropagation(el);
            L.DomEvent.disableScrollPropagation(el);
        });

        // Zoom Hierarchy Listener
        this.map.on('zoomend', () => this.handleZoomHierarchy());
        
        // Locate User
        this.map.locate({setView: true, maxZoom: 16});

        // Load offline data to map
        this.renderOfflineData();
    },

    handleZoomHierarchy() {
        const zoom = this.map.getZoom();
        for (const [type, threshold] of Object.entries(this.THRESHOLDS)) {
            const layerGroup = this.layers[type];
            if (layerGroup) {
                if (zoom < threshold) {
                    this.map.removeLayer(layerGroup);
                } else {
                    this.map.addLayer(layerGroup);
                }
            }
        }
    },

    toggleFAB() {
        document.getElementById('speed-dial').classList.toggle('hidden');
    },
    
    toggleSidebar() {
        document.getElementById('sidebar').classList.toggle('hidden');
    },

    startPlacement(type) {
        this.currentPlacementMode = type;
        this.toggleFAB();
        document.getElementById('crosshair').classList.remove('hidden');
        document.getElementById('crosshair').querySelector('.crosshair').style.borderColor = 
            type === 'HT_POLE' ? 'red' : (type === 'DT' ? 'yellow' : 'green');
    },

    async confirmLocation() {
        if (!this.currentPlacementMode) return;
        
        const center = this.map.getCenter();
        const id = `${this.currentPlacementMode}_${Date.now()}`;
        
        // 1. Data Structure for Offline DB
        const nodeData = {
            id: id,
            type: this.currentPlacementMode,
            lat: center.lat,
            lng: center.lng,
            feeder_id: "F1", // Should be selected from UI state
            synced: false,
            deleted: false
        };

        // 2. Electrical Validations (Hierarchy check example)
        if (!this.validateNode(nodeData)) return;

        // 3. Save to LocalForage
        await db.nodes.setItem(id, nodeData);

        // 4. Render to map immediately
        this.addMarkerToMap(nodeData);

        // Reset UI
        document.getElementById('crosshair').classList.add('hidden');
        this.currentPlacementMode = null;
        this.updateKPIs();
    },

    validateNode(nodeData) {
        // Validation: Consumer must be near a DT or LT pole (mock spatial check)
        if (nodeData.type === 'CONSUMER') {
            // In a real scenario, use turf.js to check distance to nearest LT_POLE/DT
            console.log("Checking consumer linkage...");
        }
        return true;
    },

    addMarkerToMap(node) {
        if (node.deleted) return;
        const marker = L.marker([node.lat, node.lng], { icon: this.Icons[node.type] });
        marker.bindPopup(`<b>${node.type}</b><br>ID: ${node.id}`);
        this.layers[node.type].addLayer(marker);
    },

    async renderOfflineData() {
        await db.nodes.iterate((value) => {
            this.addMarkerToMap(value);
        });
        // Render lines similarly reading from db.lines
        this.updateKPIs();
    },

    async updateKPIs() {
        let htPoles = 0, dtCount = 0, consCount = 0;
        await db.nodes.iterate((v) => {
            if(!v.deleted){
                if(v.type === 'HT_POLE') htPoles++;
                if(v.type === 'DT') dtCount++;
                if(v.type === 'CONSUMER') consCount++;
            }
        });
        // Assuming ~50m per span for HT lines estimation
        document.getElementById('kpi-ht').innerText = (htPoles * 0.05).toFixed(2);
        document.getElementById('kpi-dt').innerText = dtCount;
        document.getElementById('kpi-cons').innerText = consCount;
    },

    // Sync Logic
    async syncToCloud() {
        alert("Syncing data...");
        try {
            // Iterate LocalForage nodes
            const unsyncedNodes = [];
            await db.nodes.iterate((value, key) => {
                if (!value.synced || value.deleted) unsyncedNodes.push(value);
            });

            if (unsyncedNodes.length === 0) return alert("Everything is up to date.");

            // Bulk Upsert to Supabase
            const { data, error } = await supabase
                .from('survey_objects')
                .upsert(unsyncedNodes, { onConflict: 'id' });

            if (error) throw error;

            // Mark as synced locally
            for (let node of unsyncedNodes) {
                if (node.deleted) {
                    await db.nodes.removeItem(node.id); // Hard delete locally after sync
                } else {
                    node.synced = true;
                    await db.nodes.setItem(node.id, node);
                }
            }
            alert("Sync Complete!");
        } catch (err) {
            console.error("Sync failed:", err);
            alert("Sync failed. Check network.");
        }
    }
};
