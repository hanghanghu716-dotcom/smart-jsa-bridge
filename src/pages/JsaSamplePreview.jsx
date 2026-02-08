import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function JsaSamplePreview() {
  const [jsonInput, setJsonInput] = useState('');
  const [data, setData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const printRef = useRef();

  // JSON 데이터 적용
  const handleApply = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setData(parsed);
    } catch (err) {
      alert("JSON 형식이 올바르지 않습니다. 객체 구조를 확인하십시오.");
    }
  };

  // [Export.jsx 원본 로직 100% 복제] PDF 생성 및 저장
  const executeFinalAction = async () => {
    const paper = document.querySelector('.reportPaper');
    if (!paper) return;

    setIsProcessing(true);
    try {
      const doc = new jsPDF('l', 'mm', 'a4'); // 가로 방향(Landscape) 설정
      const pageWidth = 297;
      const margin = 12;
      const contentWidth = pageWidth - (margin * 2);
      const pageLimitY = 210 - margin;

      const capture = async (query) => {
        const el = paper.querySelector(query);
        if (!el) return null;
        const canvas = await html2canvas(el, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
        return {
          img: canvas.toDataURL('image/png'),
          h: (canvas.height * contentWidth) / canvas.width
        };
      };

      let currentY = margin;
      const sections = ['.reportTopSection', '.infoGridTable', '.partSub', '.participantTable', '.analSub'];

      for (const selector of sections) {
        const sectionData = await capture(selector);
        if (sectionData) {
          doc.addImage(sectionData.img, 'PNG', margin, currentY, contentWidth, sectionData.h);
          currentY += sectionData.h + (selector.includes('Sub') ? 1 : 4);
        }
      }

      const tableHeaderCanvas = await html2canvas(paper.querySelector('.analysisTable thead'), { scale: 3 });
      const tableHeaderImg = tableHeaderCanvas.toDataURL('image/png');
      const tableHeaderH = (tableHeaderCanvas.height * contentWidth) / tableHeaderCanvas.width;
      doc.addImage(tableHeaderImg, 'PNG', margin, currentY, contentWidth, tableHeaderH);
      currentY += tableHeaderH;

      const rows = paper.querySelectorAll('.analysisTable tbody tr');
      for (const row of rows) {
        const rowCanvas = await html2canvas(row, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
        const rowImg = rowCanvas.toDataURL('image/png');
        const rowH = (rowCanvas.height * contentWidth) / rowCanvas.width;

        if (currentY + rowH > pageLimitY) {
          doc.addPage();
          currentY = margin;
          doc.addImage(tableHeaderImg, 'PNG', margin, currentY, contentWidth, tableHeaderH);
          currentY += tableHeaderH;
        }
        doc.addImage(rowImg, 'PNG', margin, currentY, contentWidth, rowH);
        currentY += rowH;
      }
      
      doc.save(`JSA_Report_${data.formData.projectName || 'Sample'}.pdf`);
    } catch (error) {
      console.error("PDF 생성 오류:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // [Export.jsx 원본 스타일 100% 복제]
  const styles = {
    previewArea: { backgroundColor: '#fff', borderRadius: '4px', padding: '2.5rem', marginBottom: '1rem', border: '1px solid #ddd' },
    reportPaper: { color: '#000', fontFamily: '"Malgun Gothic", sans-serif' },
    infoGridTable: { width: '100%', borderCollapse: 'collapse', border: '2.5px solid #000', marginBottom: '1rem' },
    participantTable: { width: '100%', borderCollapse: 'collapse', border: '2.5px solid #000' },
    analysisTable: { width: '100%', borderCollapse: 'collapse', border: '2.5px solid #000' },
    pSigCell: { border: '1px solid #000', width: '10%', height: '28px', padding: '0 6px', verticalAlign: 'middle', textAlign: 'center' },
    pSigName: { fontSize: '11px', fontWeight: '500', display: 'inline-block' },
    pSigMark: { float: 'right', fontSize: '11px', fontWeight: 'bold', color: '#333', lineHeight: '28px' },
    atRiskFactor: { border: '1px solid #000', padding: '8px', verticalAlign: 'top', minWidth: '300px', fontSize: '9px', lineHeight: '1.4' },
    atMeasure: { border: '1px solid #000', padding: '8px', verticalAlign: 'top', minWidth: '350px', fontSize: '9px', lineHeight: '1.4' },
    reportTopSection: { position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', marginBottom: '1.5rem', minHeight: '90px' },
    reportTitle: { fontSize: '2.2rem', fontWeight: '900', margin: 0, borderBottom: '2px solid #000', paddingBottom: '5px' },
    reportSubTitle: { fontSize: '0.95rem', color: '#666', marginTop: '0.5rem' },
    approvalSection: { position: 'absolute', right: 0, top: 0, display: 'flex', border: '1.5px solid #000' },
    approvalBox: { width: '75px', borderLeft: '1px solid #000' },
    approvalLabel: { borderBottom: '1px solid #000', textAlign: 'center', padding: '3px', backgroundColor: '#f5f5f5', fontWeight: 'bold', fontSize: '11px' },
    approvalSign: { height: '60px' },
    hLabel: { border: '1px solid #000', backgroundColor: '#f5f5f5', padding: '8px', fontSize: '11px', width: '100px', textAlign: 'center', fontWeight: 'bold' },
    hValue: { border: '1px solid #000', padding: '8px', fontSize: '12px', textAlign: 'left' },
    tableSubtitle: { fontSize: '12px', fontWeight: 'bold', marginTop: '1rem', marginBottom: '0.4rem', color: '#444' },
    atH: { border: '1px solid #000', backgroundColor: '#f5f5f5', padding: '8px', fontSize: '11px', fontWeight: 'bold', textAlign: 'center' },
    atHSmall: { border: '1px solid #000', backgroundColor: '#fafafa', padding: '4px', fontSize: '10px', textAlign: 'center', width: '40px' },
    atCenterNo: { border: '1px solid #000', textAlign: 'center', padding: '8px', fontSize: '11px', width: '35px' },
    atStepTitle: { border: '1px solid #000', padding: '8px', fontSize: '11px', fontWeight: '500', width: '120px', backgroundColor: '#fcfcfc' },
    atCenterSmall: { border: '1px solid #000', textAlign: 'center', padding: '8px', fontSize: '11px', width: '40px' },
    atCheck: { border: '1px solid #000', width: '85px', textAlign: 'center', padding: '4px 0' },
    checkWrap: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' },
    miniLabel: { fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center' },
    rectInput: { width: '13px', height: '13px', margin: '0 3px 0 0' },
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <textarea
          style={{ width: '100%', height: '150px', marginBottom: '10px', padding: '10px', fontFamily: 'monospace' }}
          placeholder="여기에 JSON 데이터를 붙여넣으십시오."
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
        />
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
          <button onClick={handleApply} style={{ padding: '10px 20px', backgroundColor: '#333', color: '#fff', border: 'none', cursor: 'pointer' }}>양식 적용</button>
          {data && <button onClick={executeFinalAction} style={{ padding: '10px 20px', backgroundColor: '#4caf50', color: '#fff', border: 'none', cursor: 'pointer' }}>{isProcessing ? "처리 중..." : "PDF 다운로드"}</button>}
        </div>

        {data && (
          <div style={styles.previewArea}>
            <div className="reportPaper" style={styles.reportPaper}>
              <div className="reportTopSection" style={styles.reportTopSection}>
                <div style={{ textAlign: 'center' }}>
                  <h2 style={styles.reportTitle}>작업안전분석(JSA) 작업시트</h2>
                  <p style={styles.reportSubTitle}>(Job Safety Analysis Worksheet)</p>
                </div>
                <div className="approvalSection" style={styles.approvalSection}>
                  <div style={styles.approvalBox}><div style={styles.approvalLabel}>검토</div><div style={styles.approvalSign}></div></div>
                  <div style={styles.approvalBox}><div style={styles.approvalLabel}>승인</div><div style={styles.approvalSign}></div></div>
                </div>
              </div>

              <table className="infoGridTable" style={styles.infoGridTable}>
                <tbody>
                  <tr><th style={styles.hLabel}>작업명</th><td style={styles.hValue} colSpan="3">{data.formData.projectName}</td></tr>
                  <tr><th style={styles.hLabel}>작업지역</th><td style={styles.hValue}>{data.formData.workLocation}</td><th style={styles.hLabel}>수행부서</th><td style={styles.hValue}>{data.formData.department}</td></tr>
                </tbody>
              </table>

              <div className="tableSubtitle partSub" style={styles.tableSubtitle}>[ 위험성 평가 참여자 확인 ]</div>
              <table className="participantTable" style={styles.participantTable}>
                <tbody>
                  <tr>
                    {Array.from({ length: 10 }).map((_, i) => (
                      <td key={i} style={styles.pSigCell}>
                        <span style={styles.pSigName}>{data.participants[i] || '.'}</span>
                        <span style={styles.pSigMark}>(인)</span>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>

              <div className="tableSubtitle analSub" style={styles.tableSubtitle}>[ 상세 유해·위험요인 분석 및 안전대책 ]</div>
              <table className="analysisTable" style={styles.analysisTable}>
                <thead>
                  <tr><th style={styles.atH} rowSpan="2">No</th><th style={styles.atH} rowSpan="2">작업단계</th><th style={styles.atH} rowSpan="2">유해·위험요인</th><th style={styles.atH} rowSpan="2">감소권고대책</th><th style={styles.atH} colSpan="3">리스크 평가</th><th style={styles.atH} rowSpan="2">확인</th></tr>
                  <tr><th style={styles.atHSmall}>중대성</th><th style={styles.atHSmall}>기능성</th><th style={styles.atHSmall}>위험성</th></tr>
                </thead>
                <tbody>
                  {data.analysisData.map((step, i) => (
                    <tr key={i}>
                      <td style={styles.atCenterNo}>{i + 1}</td>
                      <td style={styles.atStepTitle}>{step.proc.stepTitle}</td>
                      <td style={styles.atRiskFactor}>{step.risks.map((r, idx) => <div key={idx}>• {r.factor}</div>)}</td>
                      <td style={styles.atMeasure}>{step.risks.map((r, idx) => <div key={idx}>• {r.measure}</div>)}</td>
                      <td style={styles.atCenterSmall}>{step.frequency}</td>
                      <td style={styles.atCenterSmall}>{step.severity}</td>
                      <td style={{ ...styles.atCenterSmall, fontWeight: '700', color: step.riskLevel >= 9 ? '#d32f2f' : '#1976d2' }}>{step.riskLevel}</td>
                      <td style={styles.atCheck}>
                        <div style={styles.checkWrap}>
                          <label style={styles.miniLabel}><input type="checkbox" style={styles.rectInput} readOnly /> YES</label>
                          <label style={styles.miniLabel}><input type="checkbox" style={styles.rectInput} readOnly /> NO</label>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}