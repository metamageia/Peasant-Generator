// Helper: Return a random element from an array
function randomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper: Weighted random selection
function weightedRandom(options) {
  let totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
  let randomNum = Math.random() * totalWeight;
  for (let opt of options) {
      if (randomNum < opt.weight) {
          return opt;
      }
      randomNum -= opt.weight;
  }
  return options[0];
}

let peasantData = null;

// Fetch peasantData from the external JSON file
function fetchPeasantData() {
  return fetch('commonerData.json')
      .then(response => response.json())
      .then(data => { peasantData = data; });
}

// Add this helper function to parse name templates
function generateName(nameTemplate) {
  // Replace syllable placeholders with actual syllables
  return nameTemplate.replace(/\[(.*?)\]/g, (match, type) => {
    return randomFromArray(peasantData[type]);
  });
}
  
// Generate a character for a given sheet element
function generatePeasantForSheet(sheet) {
  if (!peasantData) {
    console.error("peasantData not loaded yet.");
    return;
  }
  
  // --- Attribute Generation ---
  let baseAttributes = { "Might": 0, "Agility": 0, "Intellect": 0, "Spirit": 0 };
  const attributeKeys = ["Might", "Agility", "Intellect", "Spirit"];
  for (let i = 0; i < 4; i++) {
    const selected = randomFromArray(attributeKeys);
    baseAttributes[selected] += 1;
  }
  
  // --- Alignment Generation with Duplicate Reroll ---
  const alignmentOption = weightedRandom(peasantData.alignment);
  const tokens = alignmentOption.name.split("&").map(t => t.trim());
  function rollToken(token) {
    const type = token.substring(1, token.length - 1);
    return randomFromArray(peasantData[type]);
  }
  let firstValue = rollToken(tokens[0]);
  let secondValue = rollToken(tokens[1]);
  if (tokens[0] === tokens[1] && (tokens[0] === "[vice]" || tokens[0] === "[virtue]")) {
    while (secondValue === firstValue) { secondValue = rollToken(tokens[1]); }
  }
  const alignmentString = firstValue + " & " + secondValue;
  
  // --- Lineage Generation ---
  // Safely check if the element exists before accessing its properties
  const lineageToggle = document.getElementById("lineageToggleCheckbox");
  const useLineageOption = lineageToggle && lineageToggle.checked;
  
  const availableLineages = useLineageOption 
    ? peasantData.lineage
    : peasantData.lineage.filter(option => option.name === "Human");
  
  const lineageOption = weightedRandom(availableLineages);
  const lineage = lineageOption.name;
  
  // --- Other Character Generation ---
  const nameTemplate = weightedRandom(peasantData.commonerName).name;
  const generatedName = generateName(nameTemplate);
  sheet.querySelector(".name").value = generatedName;
  
  // Safely check if the element exists before accessing its properties
  const lineageRulesToggle = document.getElementById("lineageRulesToggle");
  const useLineageRules = lineageRulesToggle && lineageRulesToggle.checked;
  
  let pastLifeEntry = null;
  if (useLineageRules && lineage !== "Human" && peasantData.lineagePastLives && peasantData.lineagePastLives[lineage]) {
    pastLifeEntry = randomFromArray(peasantData.lineagePastLives[lineage]);
  } else {
    const groupOption = weightedRandom(peasantData.socialGroupWeights);
    const socialGroupArray = peasantData.socialGroups[groupOption.name];
    pastLifeEntry = randomFromArray(socialGroupArray);
  }
  
  const pastLife = pastLifeEntry.name;
  const abilityBonus = pastLifeEntry.abilityBonus || {};
  
  const might = baseAttributes.Might + (abilityBonus.Might || 0);
  const agility = baseAttributes.Agility + (abilityBonus.Agility || 0);
  const intellect = baseAttributes.Intellect + (abilityBonus.Intellect || 0);
  const spirit = baseAttributes.Spirit + (abilityBonus.Spirit || 0);
  
  const initiative = agility + 1;
  const accuracy = 1 + Math.max(agility, might);
  const resist = spirit + 1;
  const prevail = intellect + 1;
  const tenacity = might + spirit;
  const maxHP = 5 + might;
  const speed = 5 + agility;
  
  // Update fields on the sheet
  sheet.querySelector(".alignment").value = alignmentString;
  sheet.querySelector(".lineage").value = lineage;
  sheet.querySelector(".past-life").value = pastLife;
  
  sheet.querySelector(".might").value = might;
  sheet.querySelector(".agility").value = agility;
  sheet.querySelector(".intellect").value = intellect;
  sheet.querySelector(".spirit").value = spirit;
  
  sheet.querySelector(".initiative").value = initiative;
  sheet.querySelector(".accuracy").value = accuracy;
  // Set default Guard equal to Agility
  sheet.querySelector(".guard").value = agility;
  sheet.querySelector(".resist").value = resist;
  sheet.querySelector(".prevail").value = prevail;
  sheet.querySelector(".tenacity").value = tenacity;
  
  sheet.querySelector(".max-hp").value = maxHP;
  sheet.querySelector(".speed").value = speed;
  
  sheet.querySelector(".current-hp").value = pastLifeEntry.currentHP || "";
  sheet.querySelector(".skills").value = pastLifeEntry.skill;
  sheet.querySelector(".carried-items-text").value = pastLifeEntry.equipment;
  
  // Update Lineage Talent based on the toggle.
  const lineageTalentContainer = sheet.querySelector('.lineage-talent');
  if (useLineageRules) {
    if (peasantData.lineageTalents && peasantData.lineageTalents[lineage]) {
      lineageTalentContainer.style.display = 'flex';
      lineageTalentContainer.querySelector('.lineage-talent-text').innerHTML = peasantData.lineageTalents[lineage];
    } else {
      lineageTalentContainer.style.display = 'none';
    }
  } else {
    lineageTalentContainer.style.display = 'none';
  }
}

// Generate characters for all sheets
function generatePeasant() {
  const sheets = document.querySelectorAll('.character-sheet');
  sheets.forEach(sheet => generatePeasantForSheet(sheet));
}

// Update Lineage Talent for all sheets when the toggle changes
function updateLineageTalent() {
  const sheets = document.querySelectorAll('.character-sheet');
  sheets.forEach(sheet => {
    const lineage = sheet.querySelector(".lineage").value;
    const lineageTalentContainer = sheet.querySelector('.lineage-talent');
    const lineageRulesToggle = document.getElementById("lineageRulesToggle");
    const optionalRulesEnabled = lineageRulesToggle && lineageRulesToggle.checked;
    
    if (optionalRulesEnabled) {
      if (peasantData && peasantData.lineageTalents && peasantData.lineageTalents[lineage]) {
        lineageTalentContainer.style.display = 'flex';
        lineageTalentContainer.querySelector('.lineage-talent-text').innerHTML = peasantData.lineageTalents[lineage];
      } else {
        lineageTalentContainer.style.display = 'none';
      }
    } else {
      lineageTalentContainer.style.display = 'none';
    }
  });
}

// Export to PDF
function exportToPDF() {
  const element = document.querySelector('.sheets-container');
  const opt = {
    margin: 3,
    filename: 'commoners.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 1.2,
      useCORS: true,
      letterRendering: true
    },
    jsPDF: { 
      unit: 'mm', 
      format: [420, 297],
      orientation: 'portrait',
      compress: true,
      putOnlyUsedFonts: true,
      maxPages: 1 
    },
    pagebreak: { mode: 'avoid-all' } 
  };

  const sheetsContainer = document.querySelector('.sheets-container');
  const originalStyle = sheetsContainer.style.cssText;
  sheetsContainer.style.transform = 'scale(0.65)';
  sheetsContainer.style.transformOrigin = 'top left';
  sheetsContainer.style.maxHeight = '380mm'; 
  sheetsContainer.style.width = '150%';

  html2pdf().from(element).set(opt).save()
  .then(() => {
    sheetsContainer.style.cssText = originalStyle;
  });
}

// Set up event listeners when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  fetchPeasantData()
    .then(() => {
      const randomizeBtn = document.getElementById("randomize");
      if (randomizeBtn) {
        randomizeBtn.addEventListener("click", generatePeasant);
      }
      
      const lineageRulesToggle = document.getElementById("lineageRulesToggle");
      if (lineageRulesToggle) {
        lineageRulesToggle.addEventListener("change", updateLineageTalent);
      }
      
      const lineageToggle = document.getElementById("lineageToggleCheckbox");
      if (lineageToggle) {
        lineageToggle.addEventListener("change", generatePeasant);
      }
      
      const exportBtn = document.getElementById("exportPDF");
      if (exportBtn) {
        exportBtn.addEventListener("click", exportToPDF);
      }
      
      // Generate initial peasants
      generatePeasant();
    })
    .catch(error => console.error("Error loading peasantData:", error));
});