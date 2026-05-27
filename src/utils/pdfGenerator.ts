import { jsPDF } from 'jspdf';
import { Student, TrainingSheet, EvolutionRecord, WorkoutExercise } from '../types';
import { EXERCISE_BANK } from '../mockData';

/**
 * Generates and downloads a beautifully styled PDF report for a student
 * containing their physical evolution history and current workout plan.
 */
export function exportStudentReport(
  student: Student,
  evolutionRecords: EvolutionRecord[],
  sheet: TrainingSheet
) {
  // Create PDF document (A4, Portrait, millimeters)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageHeight = 297;
  const pageWidth = 210;
  const marginX = 15;
  const printableWidth = pageWidth - 2 * marginX; // 180mm
  let currentY = 15;

  // Helper: check page overflow and add a new page if necessary
  const checkPageOverflow = (heightNeeded: number) => {
    if (currentY + heightNeeded > pageHeight - 15) {
      doc.addPage();
      currentY = 15;
      drawHeaderBadge();
      return true;
    }
    return false;
  };

  // Helper: draw a subtle brand indicator on top of every page
  const drawHeaderBadge = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('GYMPULSE ASSESSORIA ESPORTIVA', marginX, currentY);
    doc.text(`Página ${doc.getNumberOfPages()}`, pageWidth - marginX - 15, currentY);
    
    // Draw a very thin top divider line
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.2);
    doc.line(marginX, currentY + 2, pageWidth - marginX, currentY + 2);
    
    currentY += 8;
  };

  // --- 1. HEADER SECTION ---
  // Draw primary header color block
  doc.setFillColor(18, 18, 20); // Dark Charcoal matching GymPulse screen
  doc.rect(marginX, currentY, printableWidth, 24, 'F');

  // Accent neon/emerald line at the bottom of the header block
  doc.setFillColor(16, 185, 129); // Accent Emerald
  doc.rect(marginX, currentY + 23, printableWidth, 1, 'F');

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('GYMPULSE', marginX + 6, currentY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(16, 185, 129);
  doc.text('PORTAL DO ALUNO - RELATÓRIO DE DESEMPENHO', marginX + 6, currentY + 16);

  // Date of Export
  const today = new Date().toLocaleDateString('pt-BR');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text(`Emitido em: ${today}`, pageWidth - marginX - 45, currentY + 14);

  currentY += 30; // Move below the header

  // --- 2. STUDENT DETAILS CARD ---
  // Draw card border
  doc.setDrawColor(220, 220, 224);
  doc.setFillColor(250, 250, 252);
  doc.rect(marginX, currentY, printableWidth, 26, 'FD');

  // Left vertical accent stroke
  doc.setFillColor(16, 185, 129);
  doc.rect(marginX, currentY, 1.5, 26, 'F');

  // Student info texts
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(31, 41, 55); // Gray 800
  doc.text(student.name.toUpperCase(), marginX + 6, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128); // Gray 500
  doc.text(`Foco / Objetivo:`, marginX + 6, currentY + 14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(student.objective, marginX + 32, currentY + 14);

  // Measurements summary inline
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(`Idade: ${student.age} anos    |    Altura: ${student.height.toFixed(2)}m    |    Peso Inicial: ${student.weight} kg`, marginX + 6, currentY + 20);

  // Right aligned plan details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text('PLANO ATIVO:', pageWidth - marginX - 50, currentY + 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(31, 41, 55);
  doc.text(`${student.plan.toUpperCase()} DE ASSESSORIA`, pageWidth - marginX - 50, currentY + 12);

  // Draw Joined date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(`Membro desde: ${student.joinedAt}`, pageWidth - marginX - 50, currentY + 19);

  currentY += 34;

  // --- 3. PHYSICAL EVOLUTION HISTORY SECTION ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(31, 41, 55);
  doc.text('I. HISTÓRICO DE EVOLUÇÃO FÍSICA', marginX, currentY);

  // Green underline accent for section title
  doc.setFillColor(16, 185, 129);
  doc.rect(marginX, currentY + 1.5, 40, 0.6, 'F');

  currentY += 6;

  if (evolutionRecords.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('Nenhum registro de evolução física cadastrado ainda.', marginX + 4, currentY + 5);
    currentY += 12;
  } else {
    // Render Evolution Table headers
    doc.setFillColor(243, 244, 246); // Gray 100 background
    doc.rect(marginX, currentY, printableWidth, 7, 'F');
    doc.setDrawColor(229, 231, 235); // Gray 200
    doc.line(marginX, currentY + 7, marginX + printableWidth, currentY + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(55, 65, 81); // Gray 700

    doc.text('DATA', marginX + 3, currentY + 4.5);
    doc.text('PESO (KG)', marginX + 26, currentY + 4.5);
    doc.text('IMC', marginX + 48, currentY + 4.5);
    doc.text('GORDURA %', marginX + 68, currentY + 4.5);
    doc.text('CIRCUNFERÊNCIAS E MEDIDAS CORPORAIS', marginX + 94, currentY + 4.5);

    currentY += 7;

    // Table rows
    evolutionRecords.forEach((record) => {
      checkPageOverflow(8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(31, 41, 55);

      // Format Date
      const dateFormatted = record.date.split('-').reverse().join('/');
      doc.text(dateFormatted, marginX + 3, currentY + 5);

      // Weight & BMI
      doc.setFont('helvetica', 'bold');
      doc.text(`${record.weight.toFixed(1)} kg`, marginX + 26, currentY + 5);
      doc.setFont('helvetica', 'normal');
      doc.text(record.bmi.toFixed(1), marginX + 48, currentY + 5);

      // Fat %
      const fatText = record.bodyFat ? `${record.bodyFat.toFixed(1)}%` : '--';
      doc.text(fatText, marginX + 68, currentY + 5);

      // Key circumferences formatted compact
      const measures: string[] = [];
      if (record.armRight !== undefined || record.armLeft !== undefined) {
        measures.push(`Braços (D/E): ${record.armRight || '--'}/${record.armLeft || '--'}cm`);
      }
      if (record.waist !== undefined) {
        measures.push(`Cintura: ${record.waist}cm`);
      }
      if (record.chest !== undefined) {
        measures.push(`Tórax: ${record.chest}cm`);
      }
      if (record.legRight !== undefined) {
        measures.push(`Coxa D: ${record.legRight}cm`);
      }

      const measuresString = measures.length > 0 ? measures.join('  |  ') : 'Apenas pesagem registrada';
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(107, 114, 128);
      doc.text(measuresString, marginX + 94, currentY + 5);

      // Draw bottom row line
      doc.setDrawColor(243, 244, 246);
      doc.setLineWidth(0.15);
      doc.line(marginX, currentY + 7.5, marginX + printableWidth, currentY + 7.5);

      currentY += 7.5;
    });

    currentY += 5;
  }

  // --- 4. WORKOUT TRAINING PLAN SECTION ---
  checkPageOverflow(15);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(31, 41, 55);
  doc.text('II. PLANO DE TREINO DE MUSCULAÇÃO ATUAL', marginX, currentY);

  // Underline
  doc.setFillColor(16, 185, 129);
  doc.rect(marginX, currentY + 1.5, 45, 0.6, 'F');

  currentY += 8;

  // Track if we outputted at least one workout sheet
  let hasWorkouts = false;

  const workoutLetters: ('A' | 'B' | 'C' | 'D' | 'E')[] = ['A', 'B', 'C', 'D', 'E'];

  workoutLetters.forEach((letter) => {
    const exercises = sheet[letter] || [];
    if (exercises.length === 0) return;

    hasWorkouts = true;

    // Check header space + first exercise space
    checkPageOverflow(25);

    // Workout sheet division header bar
    doc.setFillColor(30, 41, 59); // Indigo Slate Day theme
    doc.rect(marginX, currentY, printableWidth, 7, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`CONTEÚDO DA FICHA: TREINO ${letter}`, marginX + 4, currentY + 4.8);

    // Draw print box checklist for student in the gym!
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(209, 213, 219);
    doc.text('[ ] Ficha Concluída', pageWidth - marginX - 35, currentY + 4.5);

    currentY += 10;

    // Render exercises inside this division letter
    exercises.forEach((ex: WorkoutExercise, exIdx: number) => {
      // Calculate height needed for this card
      let cardHeight = 14; // base height
      let splitNotes: string[] = [];
      
      if (ex.notes) {
        splitNotes = doc.splitTextToSize(`Recomendação: ${ex.notes}`, printableWidth - 10);
        cardHeight += splitNotes.length * 3.8 + 2; 
      }

      checkPageOverflow(cardHeight);

      // Card border enclosing exercise
      doc.setDrawColor(240, 240, 244);
      doc.setFillColor(253, 253, 254);
      doc.rect(marginX, currentY, printableWidth, cardHeight, 'FD');
      
      // Left vertical indicator (thin slate bar)
      doc.setFillColor(100, 116, 139); // Slate-500
      doc.rect(marginX, currentY, 1.2, cardHeight, 'F');

      // Find base exercise in bank for category look-up
      const bankEx = EXERCISE_BANK.find(b => b.id === ex.exerciseId);
      const exCategory = bankEx ? bankEx.category : 'Geral';

      // Exercise Number & Name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42); // Gray 900
      doc.text(`${exIdx + 1}. ${ex.name.toUpperCase()}`, marginX + 4, currentY + 5.5);

      // Category tag on the right
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(115, 115, 115);
      doc.text(`(${exCategory})`, marginX + 4 + doc.getTextWidth(`${exIdx + 1}. ${ex.name.toUpperCase()} `), currentY + 5.5);

      // Custom student workout checkbox placeholders to fill with pen!
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // Gray-400
      
      const checkBoxes: string[] = [];
      for (let s = 1; s <= ex.sets; s++) {
        checkBoxes.push(`S${s} [  ]`);
      }
      doc.text(checkBoxes.join('   '), pageWidth - marginX - 48, currentY + 5.5);

      // Prescription details line
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105); // Gray-600
      doc.text(
        `SÉRIES: ${ex.sets}   |   REPS: ${ex.reps}   |   DESCANSOS: ${ex.restSec}s   |   CARGA GUIA: ${ex.weightCc} kg`,
        marginX + 4,
        currentY + 10.2
      );

      // Print original instructor notes
      if (ex.notes) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139); // Slate-500
        
        let notesY = currentY + 14.5;
        splitNotes.forEach((line) => {
          doc.text(line, marginX + 4, notesY);
          notesY += 3.8;
        });
      }

      currentY += cardHeight + 3; // Space between exercises
    });

    currentY += 5; // Extra space after workout letter block
  });

  if (!hasWorkouts) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('Nenhuma ficha de musculação ativa com exercícios no momento.', marginX + 4, currentY + 5);
    currentY += 12;
  }

  // --- 5. FOOTER SIGN-OFF NOTICE ---
  checkPageOverflow(30);

  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.4);
  doc.line(marginX, currentY + 2, pageWidth - marginX, currentY + 2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(16, 185, 129);
  doc.text('Mantenha o foco e a constância nos treinos diários!', marginX, currentY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text(
    'A evolução é decorrência da regularidade. Registre sempre o seu feedback de esforço no aplicativo!',
    marginX,
    currentY + 12
  );
  doc.text(
    'Documento gerado a partir da área do aluno. Sincronizado dinamicamente com o painel do treinador.',
    marginX,
    currentY + 16
  );

  // Save the PDF
  const safeFilename = `GymPulse_${student.name.replace(/\s+/g, '_')}_Relatorio.pdf`;
  doc.save(safeFilename);
}
