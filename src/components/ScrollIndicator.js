import React from 'react';
import '../App.css';
const ScrollIndicator = ({ currentSection, sectionCount, onDotClick }) => {
  return (
    <div className="scroll-indicator">
      {Array.from({ length: sectionCount }).map((_, index) => (
        <button
          key={index}
          className={`scroll-dot ${currentSection === index ? 'active' : ''}`}
          onClick={() => onDotClick(index)}
          aria-label={`Go to section ${index + 1}`}
        />
      ))}
    </div>
  );
};
export default ScrollIndicator;