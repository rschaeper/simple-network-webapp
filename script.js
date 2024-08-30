import Graph from "graphology";
import Sigma from "sigma";

// Constants to scale node and edge sizes
const NODE_SIZE_SCALE = 0.6; // Change this value to scale node sizes
const EDGE_SIZE_SCALE = 0.05; // Change this value to scale edge sizes
const HIGHLIGHT_COLOR = "#ADD8E6";
const UNHIGHLIGHT_COLOR = "#80808090"

// Load external JSON file:
fetch("./data_v7_for_sigma.json")
  .then((res) => res.json()) // Parse JSON response
  .then((jsonData) => {
    // Create a new graph instance
    const graph = new Graph();

    // Determine the min and max coordinates for normalization
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    jsonData.nodes.forEach(node => {
      if (node.attributes.x < minX) minX = node.attributes.x;
      if (node.attributes.y < minY) minY = node.attributes.y;
      if (node.attributes.x > maxX) maxX = node.attributes.x;
      if (node.attributes.y > maxY) maxY = node.attributes.y;
    });

    // Normalize coordinates and scale node sizes
    jsonData.nodes.forEach(node => {
      node.attributes.x = (node.attributes.x - minX) / (maxX - minX);
      node.attributes.y = (node.attributes.y - minY) / (maxY - minY);
      node.attributes.size = (node.attributes.size || 1) * NODE_SIZE_SCALE; // Scale node size
      graph.addNode(node.id, node.attributes);
    });

    // Scale edge sizes
    // Right now the source and target are also stored in the attributes for later use. Ideally, one could have a smaller JSON file size by only specifying source and target once!
    jsonData.edges.forEach(edge => {
      edge.attributes.size = (edge.attributes.size || 1) * EDGE_SIZE_SCALE; // Scale edge size
      graph.addEdge(edge.attributes.source, edge.attributes.target, edge.attributes);
    });

    const container = document.getElementById("sigma-container");

    // Instantiate sigma.js and render the graph
    const sigmaInstance = new Sigma(graph, container, {
      'enableEdgeHoverEvents': true,
    });

    // Node Hovering (ENTER)
  sigmaInstance.addListener('enterNode', function(e) {
    document.body.style.cursor = "pointer";
    const nodeId = e.node;
    const graph = sigmaInstance.getGraph();
    const color = graph.getNodeAttribute(nodeId, 'color');
    graph.setNodeAttribute(nodeId, 'original_color', color);
    graph.setNodeAttribute(nodeId, 'color', HIGHLIGHT_COLOR);

    const edgeIds = graph.edges();

    const connectedEdgeIds = edgeIds.filter(edgeId => {
      const edgeData = graph.getEdgeAttributes(edgeId);
      return edgeData.source === nodeId || edgeData.target === nodeId;
    });

    const connectedNodeSet = new Set();

    connectedEdgeIds.forEach(edgeId => {
      const edgeData = graph.getEdgeAttributes(edgeId);
      if (edgeData.source !== nodeId) connectedNodeSet.add(edgeData.source);
      if (edgeData.target !== nodeId) connectedNodeSet.add(edgeData.target);
    });

    // Convert the set to an array
    const connectedNodeIds = Array.from(connectedNodeSet);

    // `connectedNodeIds` now contains all unique nodes connected to `nodeId`
    connectedNodeIds.forEach(connectedNodeId => {
      const color = graph.getNodeAttribute(connectedNodeId, 'color');
      graph.setNodeAttribute(connectedNodeId, 'original_color', color);
      graph.setNodeAttribute(connectedNodeId, 'color', HIGHLIGHT_COLOR);
      graph.setNodeAttribute(connectedNodeId, 'forceLabel', true);
    });

    connectedEdgeIds.forEach(connectedEdgeId => {
      const color = graph.getEdgeAttribute(connectedEdgeId, 'color');
      graph.setEdgeAttribute(connectedEdgeId, 'original_color', color);
      graph.setEdgeAttribute(connectedEdgeId, 'color', HIGHLIGHT_COLOR);
    });

    graph.forEachEdge(edge => {
      if (!connectedEdgeIds.includes(edge)) {
        graph.setEdgeAttribute(edge, 'hidden', true);
      }
    });

    graph.forEachNode(node => {
      if (!connectedNodeIds.includes(node) && !(node == nodeId)) {
        const color = graph.getNodeAttribute(node, 'color');
        graph.setNodeAttribute(node, 'original_color', color);
        const label = graph.getNodeAttribute(node, 'label');
        graph.setNodeAttribute(node, 'original_label', label);
        graph.setNodeAttribute(node, 'label', '');
        graph.setNodeAttribute(node, 'color', UNHIGHLIGHT_COLOR);
      }
    })
  });

  // Node Hovering (LEAVE)
  sigmaInstance.addListener('leaveNode', function(e) {
    document.body.style.cursor = "default";
    const nodeId = e.node;
    const graph = sigmaInstance.getGraph();
    const color = graph.getNodeAttribute(nodeId, 'original_color');
    graph.setNodeAttribute(nodeId, 'color', color);

    const edgeIds = graph.edges();
    const connectedEdgeIds = edgeIds.filter(edgeId => {
      const edgeData = graph.getEdgeAttributes(edgeId);
      return edgeData.source === nodeId || edgeData.target === nodeId;
    });

    const connectedNodeSet = new Set();

    connectedEdgeIds.forEach(edgeId => {
      const edgeData = graph.getEdgeAttributes(edgeId);
      if (edgeData.source !== nodeId) connectedNodeSet.add(edgeData.source);
      if (edgeData.target !== nodeId) connectedNodeSet.add(edgeData.target);
    });

    // Convert the set to an array
    const connectedNodeIds = Array.from(connectedNodeSet);

    connectedEdgeIds.forEach(connectedEdgeId => {
      const color = graph.getEdgeAttribute(connectedEdgeId, 'original_color');
      graph.setEdgeAttribute(connectedEdgeId, 'color', color);
    });

    graph.forEachEdge(edge => {
      if (!connectedEdgeIds.includes(edge)) {
        graph.setEdgeAttribute(edge, 'hidden', false);
      }
    });

    graph.forEachNode(node => {
      if (connectedNodeIds.includes(node) && !(node == nodeId)) {
        const color = graph.getNodeAttribute(node, 'original_color')
        graph.setNodeAttribute(node, 'color', color);
        graph.setNodeAttribute(node, 'forceLabel', false)
      }
    })

    graph.forEachNode(node => {
      if (!connectedNodeIds.includes(node) && !(node == nodeId)) {
        const color = graph.getNodeAttribute(node, 'original_color');
        graph.setNodeAttribute(node, 'color', color);
        const label = graph.getNodeAttribute(node, 'original_label');
        graph.setNodeAttribute(node, 'label', label)
      }
    })
  });

    sigmaInstance.addListener('clickNode', function(e){
      const node = e.node;
      const graph = sigmaInstance.getGraph()
      const link = graph.getNodeAttribute(node, 'url')
      window.open(link, '_blank')
    })

    sigmaInstance.addListener('clickStage', function(e){
      hideSearchResults()
    })

    sigmaInstance.addListener('downStage', function(e){
      hideSearchResults()
    })

    // Get a reference to the input element and search results div
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');

    // Function to focus and zoom in on a node smoothly
    function focusOnNodeSmooth(nodeId) {
      if (!graph.hasNode(nodeId)) {
        console.error(`Node with ID ${nodeId} not found.`);
        return;
      }

      const node = graph.getNodeAttributes(nodeId);
      const camera = sigmaInstance.getCamera();

      if (node) {
        // console.log(`Focusing on node: ${nodeId} at coordinates: (${node.x}, ${node.y})`);
        hideSearchResults()

        const targetState = {
          x: node.x,
          y: node.y,
          ratio: 0.1 // Adjust the zoom level as needed
        };

        const duration = 1000; // Transition duration in milliseconds
        const startTime = Date.now();

        function animate() {
          const elapsed = Date.now() - startTime;
          const t = Math.min(elapsed / duration, 1);

          // Linear interpolation for smooth transition
          const currentState = camera.getState();
          const newState = {
            x: currentState.x + (targetState.x - currentState.x) * t,
            y: currentState.y + (targetState.y - currentState.y) * t,
            ratio: currentState.ratio + (targetState.ratio - currentState.ratio) * t,
          };

          camera.setState(newState);

          // Log camera state for debugging
          // console.log(`Camera state at t=${t}:`, newState);

          if (t < 1) {
            requestAnimationFrame(animate);
          } else {
            // Final log of the camera state
            // console.log('Final camera state:', camera.getState());
          }
        }

        requestAnimationFrame(animate);
      } else {
        console.error(`Node attributes for node ID ${nodeId} not found.`);
      }
    }

    // Add an event listener for the 'input' event
    searchInput.addEventListener('input', function(event) {
      const userInput = (event.target).value.toLowerCase(); // Convert input to lowercase for case-insensitive search
      // console.log("User input:", userInput);

      // Filter nodes based on user input
      const matchingNodes = graph.nodes().filter(node => node.toLowerCase().includes(userInput));

      // Display search results
      if (searchResults) {
        searchResults.innerHTML = ""; // Clear previous results
        matchingNodes.forEach(node => {
          const resultItem = document.createElement('div');
          resultItem.className = 'result-item';
          resultItem.textContent = node;
          resultItem.addEventListener('click', () => {
            focusOnNodeSmooth(node); // Highlight and zoom to the clicked node
            // searchResults.innerHTML = ""; // Clear search results after selection
            searchInput.value = node; // Set the search input to the selected node
          });
          searchResults.appendChild(resultItem);
        });
      }
    });

    searchInput.addEventListener('click', function(event) {
      const userInput = event.target.value.toLowerCase();
      const matchingNodes = graph.nodes().filter(node => node.toLowerCase().includes(userInput));
    
      if (searchResults) {
        searchResults.innerHTML = "";
        matchingNodes.forEach(node => {
          const resultItem = document.createElement('div');
          resultItem.className = 'result-item';
          resultItem.textContent = node;
          resultItem.addEventListener('click', () => {
            focusOnNodeSmooth(node);
            searchInput.value = node;
          });
          searchResults.appendChild(resultItem);
        });
      }
    });

    // --- Search bar interactivity ---
searchInput.addEventListener('input', function(event) {
  const userInput = event.target.value.toLowerCase();
  const matchingNodes = graph.nodes().filter(node => node.toLowerCase().includes(userInput));

  if (searchResults) {
    searchResults.innerHTML = "";
    matchingNodes.forEach((node, index) => {
      const resultItem = document.createElement('div');
      resultItem.className = 'result-item';
      resultItem.textContent = node;
      resultItem.dataset.index = index;
      resultItem.addEventListener('click', () => {
        focusOnNodeSmooth(node);
        searchInput.value = node;
        hideSearchResults();
      });
      searchResults.appendChild(resultItem);
    });
    currentFocus = -1;
  }
});

searchInput.addEventListener('click', function(event) {
  showSearchResults();
});

searchInput.addEventListener('keydown', function(event) {
  showSearchResults()
  const resultItems = searchResults.querySelectorAll('.result-item');
  if (event.key === 'ArrowDown') {
    // Navigate down
    currentFocus++;
    if (currentFocus >= resultItems.length) currentFocus = 0;
    addActive(resultItems);
  } else if (event.key === 'ArrowUp') {
    // Navigate up
    currentFocus--;
    if (currentFocus < 0) currentFocus = resultItems.length - 1;
    addActive(resultItems);
  } else if (event.key === 'Enter') {
    // Trigger focusOnNodeSmooth
    event.preventDefault();
    if (currentFocus > -1 && resultItems[currentFocus]) {
      resultItems[currentFocus].click();
    } else {
      const userInput = searchInput.value.trim().toUpperCase();
      focusOnNodeSmooth(userInput);
    }
  }
});

searchInput.addEventListener('focus', showSearchResults);

function showSearchResults() {
  if (searchResults) {
    searchResults.style.display = 'block';
  }
}

function hideSearchResults() {
  if (searchResults) {
    searchResults.style.display = 'none';
  }
}

function addActive(resultItems) {
  if (!resultItems) return false;
  removeActive(resultItems);
  if (currentFocus >= resultItems.length) currentFocus = 0;
  if (currentFocus < 0) currentFocus = resultItems.length - 1;
  resultItems[currentFocus].classList.add('result-item-active');
  searchInput.value = resultItems[currentFocus].textContent;
}

function removeActive(resultItems) {
  for (let i = 0; i < resultItems.length; i++) {
    resultItems[i].classList.remove('result-item-active');
  }
}

let currentFocus = -1;

    // Initially fit the graph to the view
    sigmaInstance.getCamera().setState({
      x: 0.5,
      y: 0.5,
      ratio: 1
    });
  })
  .catch((error) => {
    console.error("Error loading or processing the JSON file:", error);
  });
