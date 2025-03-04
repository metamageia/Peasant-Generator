// Helper: Return a random element from an array
function randomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
} // Added missing closing brace

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

let commonerData = null;

// Fetch commonerData from the external JSON file
function fetchCommonerData() {
  return fetch('commonerData.json')
      .then(response => response.json())
      .then(data => { commonerData = data; });
}

// Add this helper function to parse name templates
function generateName(nameTemplate) {
  // Replace syllable placeholders with actual syllables
  return nameTemplate.replace(/\[(.*?)\]/g, (match, type) => {
    return randomFromArray(commonerData[type]);
  });
}
  
  // Generate a character for a given sheet element
  function generateCommonerForSheet(sheet) {
    if (!commonerData) {
      console.error("commonerData not loaded yet.");
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
    const alignmentOption = weightedRandom(commonerData.alignment);
    const tokens = alignmentOption.name.split("&").map(t => t.trim());
    function rollToken(token) {
      const type = token.substring(1, token.length - 1);
      return randomFromArray(commonerData[type]);
    }
    let firstValue = rollToken(tokens[0]);
    let secondValue = rollToken(tokens[1]);
    if (tokens[0] === tokens[1] && (tokens[0] === "[vice]" || tokens[0] === "[virtue]")) {
      while (secondValue === firstValue) { secondValue = rollToken(tokens[1]); }
    }
    const alignmentString = firstValue + " & " + secondValue;
    
    // --- Lineage Generation ---
    // Filter lineage options based on the human-only toggle
    const lineageToggle = document.getElementById("lineageToggleCheckbox");
    const availableLineages = lineageToggle.checked 
      ? commonerData.lineage
      : commonerData.lineage.filter(option => option.name === "Human");
    
    const lineageOption = weightedRandom(availableLineages);
    const lineage = lineageOption.name;
    
    // --- Other Character Generation ---
    const nameTemplate = weightedRandom(commonerData.commonerName).name;
    const generatedName = generateName(nameTemplate);
    sheet.querySelector(".name").value = generatedName;
    
    // Determine which past life table to roll from:
    const uselineageRulesToggle = document.getElementById("lineageRulesToggle").checked;
    let pastLifeEntry = null;
    if (uselineageRulesToggle && lineage !== "Human" && commonerData.lineagePastLives && commonerData.lineagePastLives[lineage]) {
      pastLifeEntry = randomFromArray(commonerData.lineagePastLives[lineage]);
    } else {
      const groupOption = weightedRandom(commonerData.socialGroupWeights);
      const socialGroupArray = commonerData.socialGroups[groupOption.name];
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
    const optionalRulesEnabled = document.getElementById("lineageRulesToggle").checked;
    if (optionalRulesEnabled) {
      if (commonerData.lineageTalents && commonerData.lineageTalents[lineage]) {
        lineageTalentContainer.style.display = 'flex';
        lineageTalentContainer.querySelector('.lineage-talent-text').innerHTML = commonerData.lineageTalents[lineage];
      } else {
        lineageTalentContainer.style.display = 'none';
      }
    } else {
      lineageTalentContainer.style.display = 'none';
    }
  }
  
  // Generate characters for all sheets
  function generateCommoner() {
    const sheets = document.querySelectorAll('.character-sheet');
    sheets.forEach(sheet => generateCommonerForSheet(sheet));
  }
  
  // Update Lineage Talent for all sheets when the toggle changes
  function updateLineageTalent() {
    generateCommoner();
    const sheets = document.querySelectorAll('.character-sheet');
    sheets.forEach(sheet => {
      const lineage = sheet.querySelector(".lineage").value;
      const lineageTalentContainer = sheet.querySelector('.lineage-talent');
      const optionalRulesEnabled = document.getElementById("lineageRulesToggle").checked;
      if (optionalRulesEnabled) {
        if (commonerData && commonerData.lineageTalents && commonerData.lineageTalents[lineage]) {
          lineageTalentContainer.style.display = 'flex';
          lineageTalentContainer.querySelector('.lineage-talent-text').innerHTML = commonerData.lineageTalents[lineage];
        } else {
          lineageTalentContainer.style.display = 'none';
        }
      } else {
        lineageTalentContainer.style.display = 'none';
      }
      });
    }
    
    // Set up event listeners when the DOM is fully loaded.
    document.addEventListener("DOMContentLoaded", () => {
      fetchCommonerData()
        .then(() => {
          document.getElementById("randomize").addEventListener("click", generateCommoner);
          document.getElementById("lineageRulesToggle").addEventListener("change", updateLineageTalent);
          document.getElementById("lineageToggleCheckbox").addEventListener("change", generateCommoner);
          document.getElementById("exportPDF").addEventListener("click", exportToPDF);
          generateCommoner();
        })
        .catch(error => console.error("Error loading commonerData:", error));
    });

  // Export to PDF
  function exportToPDF() {
    const element = document.querySelector('.sheets-container');
    const opt = {
      margin: 3,
      filename: 'commoner-characters.pdf',
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
  
  document.addEventListener("DOMContentLoaded", () => {
    fetchCommonerData()
      .then(() => {
        document.getElementById("randomize").addEventListener("click", generateCommoner);
        document.getElementById("lineageRulesToggle").addEventListener("change", updateLineageTalent);
        document.getElementById("exportPDF").addEventListener("click", exportToPDF);
        generateCommoner();
      })
      .catch(error => console.error("Error loading commonerData:", error));
  });