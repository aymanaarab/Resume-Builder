import { launch } from 'puppeteer';
import Resume from '../models/Resume.js';

export async function generatePDF(req, res) {
  const { personalInfo, summary, experiences, educations, languages, skills, projects, certificates, selectedTemplate } = req.body;

  try {
    console.log('Received request to generate PDF');

    const newResume = new Resume({
      user: req.user.id, // Assuming you have the user ID from authenticated user
      content: {
        personalInfo,
        summary,
        experiences,
        educations,
        languages,
        skills,
        projects,
        certificates,
        selectedTemplate
      }
    });

    // Save the resume to the database
    const savedResume = await newResume.save();
    console.log('Resume saved to database:', savedResume);

    let browser;
    try {
      browser = await launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        timeout: 60000 // Increase timeout to 60 seconds
      });
      const page = await browser.newPage();

      await page.setContent(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: Arial, sans-serif;
              }
              .container {
                width: 80%;
                margin: 0 auto;
              }
              h1 {
                text-align: center;
                margin-bottom: 20px;
              }
              .section {
                margin-bottom: 10px;
              }
              .section h2 {
                margin: 0;
              }
              .section p {
                margin: 5px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Resume</h1>
              <div class="section">
                <h2>Name</h2>
                <p>${personalInfo.firstName} ${personalInfo.lastName}</p>
              </div>
              <div class="section">
                <h2>Email</h2>
                <p>${personalInfo.email}</p>
              </div>
              <div class="section">
                <h2>Phone</h2>
                <p>${personalInfo.phone}</p>
              </div>
              <div class="section">
                <h2>Summary</h2>
                <p>${summary}</p>
              </div>
              <div class="section">
                <h2>Experience</h2>
                <ul>
                  ${experiences.map(exp => `<li>${exp.title} at ${exp.company}</li>`).join('')}
                </ul>
              </div>
              <div class="section">
                <h2>Education</h2>
                <ul>
                  ${educations.map(edu => `<li>${edu.degree} in ${edu.fieldOfStudy} at ${edu.school}</li>`).join('')}
                </ul>
              </div>
              <div class="section">
                <h2>Languages</h2>
                <ul>
                  ${languages.map(lang => `<li>${lang.language} (${lang.proficiency})</li>`).join('')}
                </ul>
              </div>
              <div class="section">
                <h2>Skills</h2>
                <ul>
                  ${skills.map(skill => `<li>${skill.skill} (${skill.level})</li>`).join('')}
                </ul>
              </div>
              <div class="section">
                <h2>Projects</h2>
                <ul>
                  ${projects.map(proj => `<li>${proj.name} (${proj.description})</li>`).join('')}
                </ul>
              </div>
              <div class="section">
                <h2>Certificates</h2>
                <ul>
                  ${certificates.map(cert => `<li>${cert.name} (${cert.organization})</li>`).join('')}
                </ul>
              </div>
            </div>
          </body>
        </html>
      `);

      console.log('Page content set successfully');

      // Create a PDF
      const pdf = await page.pdf({ format: 'A4' });
      console.log('PDF generated successfully');

      await browser.close();
      console.log('Browser closed successfully');

      // Set the response headers and send the PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=resume.pdf');
      res.send(pdf);
      console.log('PDF sent successfully');
    } catch (pdfError) {
      console.error('Error generating PDF:', pdfError);
      if (browser) await browser.close();
      res.status(500).send('Error generating PDF');
    }
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).send('Server error');
  }
}
