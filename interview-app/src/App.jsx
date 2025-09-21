import { useState, useEffect, useRef } from "react";
import './App.css'
import { get, post, patch, del } from "./api";
import { transcribeAudio } from "./openaiClient";
const STUDENTID="s4971514"

function Table({ columns, rows }) {
  // This function returns a table for reuse.  
  return (
    <div id="display-table-container">
      <table id="display-table" >
        <thead className="kaushan-script-regular">
          <tr>
            {columns.map(c => <th key={c}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => <td key={j}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DisplayInterview({list, onEdit, refresh, setActivePage, setInterviewID, setBigTitle}) {
  // This function make use of the table() function to return a table with INTERVIEW Information. 
  const columns = ["ID", "Title", "Job Role", "Status", "Questions", "Applicants", "Actions"];

  const rows = list.map(i => [
    i.id,
    i.title,
    i.job_role,
    i.status,
    <div id="interview-display-table-question-cell">
      <span id="interview-display-table-question-cell-text">{i.questionCount} Questions</span>
      {/* The PER-INTERVIEW question-edit button. */}
      <button id="interview-display-table-question-cell-edit-button"
        onClick={() => {
          setActivePage("question-display")
          setInterviewID(i.id)
        }}
      >Edit</button>
    </div>,
    <div id="interview-display-table-applicant-cell">
      <span id="interview-display-table-applicant-cell-text">{i.applicantCount} Applicants</span>
      {/* The PER-INTERVIEW applicant-edit button. */}
      <button id="interview-display-table-applicant-cell-edit-button"
        onClick={() => {
          setActivePage("applicant-display")
          setInterviewID(i.id)
        }}
      >View</button>
    </div>, 
    <div id="interview-display-table-edit-cell">
      <button
        id="interview-display-table-edit-cell-edit-button"
        onClick={() => onEdit(i)}
      >
        ✏️ Edit
      </button>
      <button
        id="interview-display-table-edit-cell-delete-button"
        onClick={() => deleteInterview(i.id, refresh)}
      >
        🗑️ Delete
      </button>
    </div>
  ]);

  return <Table columns={columns} rows={rows} />;
}

function CreateInterview({ onDone, refresh, interview, setBigTitle}) {
  const [title, setTitle] = useState(interview?.title || "");
  const [jobRole, setJobRole] = useState(interview?.job_role || "");
  const [description, setDescription] = useState(interview?.description || "");
  const [status, setStatus] = useState(interview?.status || "Draft");

  async function handleSubmit() {
    let code;
    if (interview) {
      // editing an existing one
      code = await updateInterview(interview.id, title, jobRole, status, description);
    } else {
      // creating new one
      code = await createInterview_1(title, jobRole, status, description);
    }

    if (code === 0) {
      await refresh();
      onDone();
    }
  }

  return (
    <div id="interview-create-form"> 
      <div id="interview-create-form-title" className="kaushan-script-regular">
        {interview ? "Edit Interview" : "New Interview"}
      </div>

      <div id="interview-create-form-field_title" className="kaushan-script-regular">Title*</div>
      <input
        id="interview-create-form-title-input-field"
        type="text"
        value={title}
        placeholder="Interview Title"
        onChange={e => setTitle(e.target.value)}
      />

      <div id="interview-create-form-field_job-role" className="kaushan-script-regular">Job Role*</div>
      <input
        id="interview-create-form-job-role-input-field"
        type="text"
        value={jobRole}
        placeholder="Job Role"
        onChange={e => setJobRole(e.target.value)}
      />

      <div id="interview-create-form-field_description" className="kaushan-script-regular">Description*</div>
      <textarea
        id="interview-create-form-description-input-field"
        value={description}
        placeholder="Description"
        onChange={e => setDescription(e.target.value)}
      />

      <div id="interview-create-form-field_status" className="kaushan-script-regular">Status*</div>
      <select
        id="interview-create-form-status-input-field"
        value={status}
        onChange={e => setStatus(e.target.value)}
      >
        <option value="Draft">Draft</option>
        <option value="Published">Published</option>
        <option value="Archived">Archived</option>
      </select>

      <button id="interview-create-form-submit-button" className="kaushan-script-regular" onClick={handleSubmit}>
        Submit
      </button>
      <button id="interview-create-form-cancel-button" className="kaushan-script-regular" onClick={onDone}>
        Cancel
      </button>
    </div>
  );
}

function DisplayQuestion({ Interview_ID, setVisiable, setActivePage, setEditingQuestion, setBigTitle}) {
  const [questionList, setQuestionList] = useState([]);

  async function refreshQuestions(interviewID = Interview_ID) {
    try {
      const res = await getInterviewQuestions(interviewID);
      setQuestionList(res);
    } catch (err) {
      console.error("Failed to fetch questions:", err);
    }
  }

  useEffect(() => {
    setBigTitle("Question Management");
    setVisiable(true);
    if (Interview_ID !== -1) {
      refreshQuestions();
    }
  }, [Interview_ID]);

  const columns = ["ID", "InterviewID", "Question", "Difficulty", "Actions"];
  const rows = questionList.map(i => [
    i.id,
    i.interview_id,
    i.question,
    i.difficulty,
    <div id="question-display-table-action-cell">
      {/* Edit button */}
      <button
        id="question-display-table-action-cell-edit-button"
        onClick={() => {
          setEditingQuestion(i);
          setActivePage("question-create");
          setVisiable(false);
        }}
      >
        Edit
      </button>

      {/* Delete button */}
      <button
        id="question-display-table-action-cell-delete-button"
        onClick={() => {
          deleteQuestion(i.id, refreshQuestions, Interview_ID);
        }}
      >
        Delete
      </button>
    </div>
  ]);

  return <Table columns={columns} rows={rows} />;
}
 
function CreateQuestion({ Interview_ID, setActivePage, setVisiable, editingQuestion, setBigTitle}) {
  const [question, setQuestion] = useState(editingQuestion?.question || "");
  const [difficulty, setDifficulty] = useState(editingQuestion?.difficulty || "Easy");

  async function handleSubmit() {
    let code;
    if (editingQuestion) {
      // update existing one
      code = await updateQuestion(editingQuestion.id, question, difficulty);
    } else {
      // create new one
      code = await createQuestion(Interview_ID, question, difficulty);
    }

    if (code === 0) {
      setActivePage("question-display");
      setVisiable(true);
    }
  }

  return (
    <div id="question-create-main-form" className="kaushan-script-regular">
      <div id="question-create-main-form-title">
        {editingQuestion ? "Edit Question" : "New Question"}
      </div>

      <div id="question-create-main-form_field_interview-id">InterviewID</div>
      <input
        id="question-create-main-form_input_interview-id"
        value={Interview_ID}
        readOnly
      />

      <div id="question-create-main-form_field_question">Question</div>
      <input
        id="question-create-main-form_input_question"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Question"
      />

      <div id="question-create-main-form_field_difficulty">Difficulty</div>
      <select
        id="question-create-main-form_input_difficulty"
        value={difficulty}
        onChange={(e) => setDifficulty(e.target.value)}
      >
        <option value="Easy">Easy</option>
        <option value="Intermediate">Intermediate</option>
        <option value="Advanced">Advanced</option>
      </select>

      <button
        id="question-create-main-form-cancel-button"
        onClick={() => {
          setActivePage("question-display");
          setVisiable(true);
        }}
      >
        Cancel
      </button>

      <button
        id="question-create-main-form-submit-button"
        onClick={handleSubmit}
      >
        Submit
      </button>
    </div>
  );
}

function DisplayApplicant({ Interview_ID, setActivePage, setVisiable, setBigTitle, setApplicantId, setCurrentApplicant}) {
  const [applicantList, setApplicantList] = useState([]);

  async function refreshApplicants(interviewID = Interview_ID) {
    try {
      const res = await getApplicant(interviewID);
      setApplicantList(res);
      console.log(res);
    } catch (err) {
      console.error("Failed to fetch applicants:", err);
    }
  }

  useEffect(() => {
    refreshApplicants();
    async function init() {
      setVisiable(true);
      setBigTitle("Applicant Management");

      if (Interview_ID !== -1) {
        await refreshApplicants();
      }
    }
    init(); 
  }, [Interview_ID]);

  const columns = ["ApplicantID", "InterviewID", "Name", "Phone", "Email", "Status", "Answer"];

  const rows = applicantList.map(a => [
    a.id,                  
    a.interview_id,        
    `${a.title} ${a.firstname} ${a.surname}`, 
    a.phone_number,        
    a.email_address,      
    a.interview_status,    
    <div id="applicant-display-table-answer-cell">
      {/* View Button */}
      <button
        id="applicant-display-table-answer-cell-view-button"
        onClick={() => {
          setApplicantId(a.id);
          setCurrentApplicant(a);
          setActivePage("answer-display"); 
        }}
      >
        View
      </button>

      {/* Delete Button*/}
      <button
        id="applicant-display-table-answer-cell-delete-button"
        onClick={() => {
          deleteApplicant(a.id, refreshApplicants, Interview_ID);
        }}
      >
        Delete
      </button>
    </div>
  ]);

  return <Table columns={columns} rows={rows} />;
}

function CreateApplicant({Interview_ID, setActivePage, setVisiable, setBigTitle}){
  const inviteLink = `${window.location.origin}?page=applicantPage&interview-id=${Interview_ID}`;
  return (
    <>
      <div id="applicant-create-window">
        <div id="applicant-create-window-prompt" className="kaushan-script-regular">Copy the following link to invite.</div>
        <div id="applicant-create-window-link-container">{inviteLink}</div>
        <button id="applicant-create-window-back-button" 
          onClick={()=>{
            setVisiable(true);
            setActivePage("applicant-display");
          }} 
        >Back</button>
      </div>
    </>
  )

}

function RegisterApplicant({F_Interview_ID, setActivePage, setApplicantId, setCurrentApplicant}) {
  const [interviewId, setInterviewId] = useState(F_Interview_ID);
  const [genderTitle, setGenderTitle] = useState("Mr");
  const [firstName, setFirstName] = useState("");
  const [surname, setSurName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [interviewStatus, setInterviewStatus] = useState("Not Started");

  async function handleSubmit() {
    const code = await createApplicant(
      interviewId,
      genderTitle,
      firstName,
      surname,
      phoneNumber,
      email,
      interviewStatus
    );

    if (code === 0) {
      // After-Register logic. 
      const allApplicants = await getApplicant(interviewId);
      const newApplicant = allApplicants.find(
        a => a.email_address === email && a.firstname === firstName && a.surname === surname 
      );
      setCurrentApplicant(newApplicant);
      // console.log(newApplicant.id);
      setApplicantId(newApplicant.id);
      setActivePage("interview-take");
    } else {
      alert("Failed to register applicant.");
    }
  }

  return (
    <div id="register-applicant-window-form" className="kaushan-script-regular">
      <div id="register-applicant-window-form-title">Prepare for your interview!</div>
      <div id="register-applicant-window-form-gender-title-label">Title</div>
      <select
        id="register-applicant-window-form-gender-title-input"
        value={genderTitle}
        onChange={e => setGenderTitle(e.target.value)}
      >
        <option value="Mr">Mr</option>
        <option value="Ms">Ms</option>
        <option value="Dr">Dr</option>
      </select>

      <div id="register-applicant-window-form-first-name-label">First Name</div>
      <input
        id="register-applicant-window-form-first-name-input"
        value={firstName}
        onChange={e => setFirstName(e.target.value)}
        placeholder="Enter your first name"
      />

      <div id="register-applicant-window-form-sur-name-label">Sur Name</div>
      <input
        id="register-applicant-window-form-sur-name-input"
        value={surname}
        onChange={e => setSurName(e.target.value)}
        placeholder="Enter your surname"
      />

      <div id="register-applicant-window-form-phone-label">Phone Number</div>
      <input
        id="register-applicant-window-form-phone-input"
        value={phoneNumber}
        onChange={e => setPhoneNumber(e.target.value)}
        placeholder="Enter your phone number"
      />

      <div id="register-applicant-window-form-email-label">Email</div>
      <input
        id="register-applicant-window-form-email-input"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Enter your email"
      />

      <button
        id="register-applicant-window-form-submit-button"
        onClick={handleSubmit}
      >
        Prepare
      </button>
    </div>
  );
}

function TakeInterview({F_Interview_ID, setActivePage,  currentApplicant}){
  return (
    <>
      <button id="interview-take-big-big-button" className="kaushan-script-regular"
        onClick={() =>{
          setActivePage("interview-taking");
        }}
      >START</button>
    </>
  )
}

function TakingInterview({ F_Interview_ID, F_Applicant_ID, setActivePage, currentApplicant}) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0); 
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [transcript, setTranscript] = useState("");

  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);

  useEffect(() => {
    async function loadQuestions() {
      try {
        const res = await getInterviewQuestions(F_Interview_ID);
        setQuestions(res);
        setCurrentQuestion(res[0] ?? null);
      } catch (err) {
        console.error("Failed to load questions:", err);
      }
    }
    if (F_Interview_ID !== -1) {
      loadQuestions();
    }
  }, [F_Interview_ID]);

  useEffect(() => {
    setCurrentQuestion(questions[currentIndex] ?? null);
  }, [currentIndex, questions]);

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Your browser does not support audio recording.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      let chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: mediaRecorder.mimeType });
        try {
          const text = await transcribeAudio(audioBlob);

          setTranscript(prev => prev + (prev ? " " : "") + text);
        } catch (err) {
          console.error("Transcription failed:", err);
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setRecording(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentQuestion) return;
    console.log(F_Interview_ID);
    const result = await createApplicantAnswer(
      F_Interview_ID,
      currentQuestion.id,  
      F_Applicant_ID,
      transcript
    );

    if (result === 0) {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex(currentIndex + 1);
        setTranscript("");
      } else {
        // AFTER-FINISH LOGIC. 
        const statusResult = await updateApplicant(
          F_Applicant_ID,
          F_Interview_ID,
          currentApplicant.title,
          currentApplicant.firstname,
          currentApplicant.surname,
          currentApplicant.phone_number,
          currentApplicant.email_address,
          "Completed", 
          STUDENTID
        );
        if (statusResult === 0) {
          setActivePage("applicant-congratulation"); 
        } else {
          alert("Interview completed, but failed to update status.");
        }
      }
    }
  };

  return (
    <div id="interview-taking-main-container">
      {currentQuestion ? (
        <div id="interview-taking-main-container-question-display">
          {currentQuestion.question}
        </div>
      ) : (
        <div id="interview-taking-main-container-question-display" style={{color: "red"}}>
          No questions available for this interview. 
        </div>
      )}

      <textarea
        id="interview-taking-main-container-question-textarea"
        value={transcript}
        readOnly
      />

      <button
        id="interview-taking-main-container-recording-button"
        className="kaushan-script-regular"
        onClick={recording ? stopRecording : startRecording}
      >
        {recording ? "Stop Recording" : "Start Recording"}
      </button>

      <button
        id="interview-taking-main-container-submit-button"
        className="kaushan-script-regular"
        onClick={handleSubmit}
      >
        Submit
      </button>

      <div id="interview-taking-main-container-question-counter" className="kaushan-script-regular">
        {currentIndex + 1} OUT OF {questions.length}
      </div>
    </div>
  );
}

function ContratulationApplicant({}){
  return (
    <>
      <div id="applicant-congratulation-main-frame" className="kaushan-script-regular"> CONGRATULATIONS!</div>
    </>
  )
}

function DisplayAnswer({ Interview_ID, applicantId, currentApplicant, setActivePage, setVisiable, setBigTitle }) {
  const [answerList, setAnswerList] = useState([]);

  async function refreshAnswers() {
    try {
      const res = await getApplicantAnswers(applicantId);
      setAnswerList(res);
    } catch (err) {
      console.error("Failed to fetch answers:", err);
    }
  }

  useEffect(() => {
    setBigTitle(`Answers for ${currentApplicant?.firstname} ${currentApplicant?.surname}`);
    setVisiable(true);
    if (applicantId !== -1) {
      refreshAnswers();
    }
  }, [applicantId]);

  const columns = ["AnswerID", "InterviewID", "QuestionID", "ApplicantID", "Answer"];

  const rows = answerList.map(ans => [
    ans.id,            // AnswerID
    ans.interview_id,  // InterviewID
    ans.question_id,   // QuestionID
    ans.applicant_id,  // ApplicantID
    ans.answer         // Answer text
  ]);

  return <Table columns={columns} rows={rows} />;
}

// ===================================================================================
// API Helper Functions. 
// ===================================================================================
async function createInterview_1(title, jobRole, status, description, username=STUDENTID) {
  try {
    const newInterview = await post("/interview", {
      title: title,
      job_role: jobRole,
      status: status,              // MUST be one of ["Published", "Draft", "Archived"]
      username: username,
      description: description     // Not nes-required 
    });
    return 0;
  } catch (err) {
    console.error("Failed to create:", err);
    return 1;
  }
}
async function updateInterview(id, title, jobRole, status, description, username = STUDENTID) {
  try {
    await patch(`/interview?id=eq.${id}`, {
      title: title,
      job_role: jobRole,
      status: status,             // ["Published", "Draft", "Archived"]
      username: username,
      description: description
    });
    return 0;
  } catch (err) {
    console.error("Failed to update:", err);
    return 1;
  }
}
async function deleteInterview(id, refresh) {
  try {
    await del(`/interview?id=eq.${id}`);  
    if (refresh) await refresh();   // auto-refresh if given
    return 0;
  } catch (err) {
    console.error("Failed to delete:", err);
    return 1;
  }
}
async function getInterviewQuestions(interviewID){
  const res = get(`/question?interview_id=eq.${interviewID}`);
  return res;
}
async function createQuestion(interviewID, question="TEST", difficulty = "Advanced", username=STUDENTID) {
  try {
    const newQuestion = await post("/question", {
      interview_id: interviewID,
      question: question,
      difficulty: difficulty,       // MUST be one of "Easy", "Intermediate", "Advanced"
      username: username,
    }); 
    return 0;   // success 
  } catch (err) { 
    console.error("Failed to create question:", err); 
    return 1;   // failure 
  } 
} 
async function updateQuestion(id, question, difficulty, username=STUDENTID) {
  try {
    await patch(`/question?id=eq.${id}`, {
      question,
      difficulty,
      username,
    });
    return 0;
  } catch (err) {
    console.error("Failed to update question:", err);
    return 1;
  }
}
async function deleteQuestion(id, refresh, interviewID) {
  try {
    await del(`/question?id=eq.${id}`);
    if (refresh) {
      await refresh(interviewID); // re-fetch only this interview’s questions
    }
    return 0;
  } catch (err) {
    console.error("Failed to delete question:", err);
    return 1;
  }
}
async function getApplicant(interviewID) {
  try {
    const res = await get(`/applicant?interview_id=eq.${interviewID}`);
    return res; // an array of applicants
  } catch (err) {
    console.error("Failed to fetch applicants:", err);
    return []; // safe fallback
  }
}
async function createApplicant(
  interview_id = 1,
  title = "Mr",
  firstname = "Test",
  surname = "User",
  phone_number = "0400000000",
  email_address = "test@example.com",
  interview_status = "Not Started", // "Not Started", "Completed"
  username = STUDENTID
) {
  try {
    await post("/applicant", {
      interview_id: interview_id,
      title: title,
      firstname: firstname,
      surname: surname,
      phone_number: phone_number,
      email_address: email_address,
      interview_status: interview_status,
      username: username
    });
    console.log("Success.\n");
    return 0; // success
  } catch (err) {
    console.error("Failed to create applicant:", err);
    return 1; // failure
  }
}
async function updateApplicant(
  applicant_id,          
  interview_id,
  title,
  firstname,
  surname,
  phone_number,
  email_address,
  interview_status = "Not Started",
  username = STUDENTID
) {
  try {
    await patch(`/applicant?id=eq.${applicant_id}`, {
      interview_id,
      title,
      firstname,
      surname,
      phone_number,
      email_address,
      interview_status,
      username
    });
    console.log(`Applicant ${applicant_id} updated successfully.`);
    return 0; // success
  } catch (err) {
    console.error("Failed to update applicant:", err);
    return 1; // failure
  }
}
async function deleteApplicant(applicant_id, refresh, interviewID) {
  try {
    await del(`/applicant?id=eq.${applicant_id}`);
    if (refresh) {
      await refresh(interviewID); 
    }
    console.log(`Applicant ${applicant_id} deleted successfully.`);
    return 0; // success
  } catch (err) {
    console.error("Failed to delete applicant:", err);
    return 1; // failure
  }
}
async function createApplicantAnswer(
  Interview_ID,
  Question_ID,
  Applicant_ID,
  Answer,
  Username = STUDENTID
) {
  try {
    await post("/applicant_answer", {
      interview_id: Interview_ID,
      question_id: Question_ID,
      applicant_id: Applicant_ID,
      answer: Answer,
      username: Username
    });
    console.log("TEST: Answer saved successfully.");
    return 0; 
  } catch (err) {
    console.error("TEST: Failed to save applicant answer:", err);
    return 1; 
  }
}
async function getApplicantAnswers(applicantId) {
  try {
    const res = await get(`/applicant_answer?applicant_id=eq.${applicantId}`);
    return res; 
  } catch (err) {
    console.error("Failed to fetch applicant answers:", err);
    return []; 
  }
}

// ===================================================================================
// End Of API Helper Functions. 
// ===================================================================================

function PageInterview({setTitle}){ 
  const [interviewList, setInterviewList] = useState([]); 


  // const [activePage, setActivePage] = useState("interview-display"); 
  // const [activePage, setActivePage] = useState("applicant-create"); 
  const [activePage, setActivePage] = useState("applicant-display"); 


  const [editingInterview, setEditingInterview] = useState(null); 
  const [editingQuestion, setEditingQuestion] = useState(null); 
  const [interviewID, setInterviewID] = useState(-1); 
  const [visiable, setVisiable] = useState(false); 
  const [bigTitle, setBigTitle] = useState("Interview Management"); 
  const [applicantId, setApplicantId] = useState(-1); 
  const [currentApplicant, setCurrentApplicant] = useState(null); 
  const PAGES = {
    "interview-display": () => (
      <DisplayInterview
        list={interviewList}
        onEdit={(interview) => {
          setEditingInterview(interview);
          setActivePage("interview-create");
        }}
        refresh={refreshList}
        setActivePage={setActivePage}
        setInterviewID={setInterviewID}
        setBigTitle={setBigTitle}
      />
    ),
    "interview-create": () => (
      <CreateInterview
        onDone={() => setActivePage("interview-display")}
        refresh={refreshList}
        interview={editingInterview}
        setBigTitle={setBigTitle}
      />
    ),
    "question-display":() => (
      <DisplayQuestion 
        Interview_ID = {interviewID}
        setVisiable = {setVisiable}
        setActivePage = {setActivePage}
        setEditingQuestion = {setEditingQuestion}
        setBigTitle = {setBigTitle}
      />
    ),
    "question-create": () => (
      <CreateQuestion
        Interview_ID = {interviewID}
        setActivePage = {setActivePage}
        setVisiable = {setVisiable}
        editingQuestion = {editingQuestion}
      />
    ), 
    "applicant-display": () =>(
      <DisplayApplicant
        Interview_ID = {interviewID}
        setActivePage = {setActivePage}
        setVisiable = {setVisiable}
        setBigTitle = {setBigTitle}
        setApplicantId = {setApplicantId}
        setCurrentApplicant = {setCurrentApplicant}
      />
    ),
    "applicant-create": () =>(
      <CreateApplicant
        Interview_ID = {interviewID}
        setActivePage = {setActivePage}
        setVisiable = {setVisiable}
        setBigTitle = {setBigTitle}
      />
    ),
    "answer-display": () => (
      <DisplayAnswer
        Interview_ID = {interviewID}
        applicantId = {applicantId}
        currentApplicant = {currentApplicant}
        setActivePage = {setActivePage}
        setVisiable = {setVisiable}
        setBigTitle = {setBigTitle}
      />
    )
  };
  
  const Page = PAGES[activePage] ?? PageInterview;


  async function refreshList() {
    try {
      const interviews = await get("/interview");
      const questions  = await get("/question");    
      const applicants = await get("/applicant"); 
      const qCounts = {};
      questions.forEach(q => {
        qCounts[q.interview_id] = (qCounts[q.interview_id] || 0) + 1;
      });

      const aCounts = {};
      applicants.forEach(a => {
        aCounts[a.interview_id] = (aCounts[a.interview_id] || 0) + 1;
      });
      const withCounts = interviews.map(i => ({
        ...i,
        questionCount: qCounts[i.id] || 0,
        applicantCount: aCounts[i.id] || 0,
      }));

      setInterviewList(withCounts);
    } catch (err) {
      console.error("Failed to load:", err);
    }
  }

  useEffect(() => { refreshList(); }, []);
  return (
    <>
      <div id="interview-management-title" className="kaushan-script-regular">
        <span id="interview-management-title-content">{bigTitle}</span>
        {/* The BIG BACK button functionality. */}
        <button id="interview-management-title-back-button" style={{ display: visiable ? "block" : "none" }} 
          onClick={()=>{
            if(activePage === "question-display"){
              setBigTitle("Interview Management");
              setActivePage("interview-display");
              refreshList();
              setVisiable(false);
            }else if(activePage === "applicant-display"){
              setBigTitle("Interview Management");
              setActivePage("interview-display");
              refreshList();
              setVisiable(false);
            }else if(activePage === "answer-display"){
              setBigTitle("Applicant Management");
              setActivePage("applicant-display");
              refreshList();
              setVisiable(false);
            }
            
          }
          }
        >Back</button>

        <button id="interview-management-title-button" onClick={() => {
          {/* The BIG NEW+ button functionality. */}
          if(activePage==="interview-display" || activePage==="interview-create"){
            setActivePage("interview-create");
            setEditingInterview(null);
          }else if(activePage==="question-display"){
            setEditingQuestion(null);
            setActivePage("question-create");
            setVisiable(false);
          }else if(activePage==="applicant-display"){
            setActivePage("applicant-create");
            setVisiable(false);
          }else{
            console.log("Line 331, error. ");
          }

          }}>New +</button>
      </div>
      <div id="interview-management-table">
        <Page />
      </div>

  
    </>
  )

}

function PageApplicant({interview_id}){
  const [applicantId, setApplicantId] = useState(-1);
  const [currentApplicant, setCurrentApplicant] = useState(null);

  const [activePage, setActivePage] = useState("applicant-register");
  // const [activePage, setActivePage] = useState("interview-take");
  // const [activePage, setActivePage] = useState("interview-taking");
  // const [activePage, setActivePage] = useState("applicant-congratulation");


  const PAGES = {
    "applicant-register": () => (
      <RegisterApplicant
        F_Interview_ID = {interview_id}
        setActivePage = {setActivePage}
        setApplicantId = {setApplicantId}
        setCurrentApplicant = {setCurrentApplicant}
      />
    ),
    "interview-take":() =>(
      <TakeInterview
        F_Interview_ID = {interview_id}
        setActivePage = {setActivePage}
        currentApplicant = {currentApplicant}
      />
    ),
    "interview-taking": () => (
      <TakingInterview
        F_Interview_ID = {interview_id}
        F_Applicant_ID = {applicantId}
        setActivePage = {setActivePage}
        currentApplicant = {currentApplicant}
      />
    ),
    "applicant-congratulation":()=>(<
      ContratulationApplicant
      />
    )
  }
  const Page = PAGES[activePage] ?? PageInterview;
  return(
    <>
      <div id="applicant-window-header-container" className="kaushan-script-regular">
        <div id="applicant-window-header-container-content">Welcome to interview {interview_id}</div>
      </div>
      <div id="applicant-window-main-frame">
          <Page/>
      </div>
    </>
  )
}

function App() {
  const params = new URLSearchParams(window.location.search);
  // https://localhost:5173?        
  // https://localhost:5173?page=applicantPage&interview-id=2812
  const main_page = params.get("page") || "interviewManagement";
  const interview_id = params.get("interview-id") || -1;
  const [activePage, setActivePage] = useState("interview");
  const [title, setTitle] = useState("Interview Management");
  const PAGES = { 
    interview: () =>(
      <PageInterview
        setTitle={setTitle}
      />
    ), 
    applicant: () => (
      <PageApplicant
        interview_id={interview_id}
      />
    )
  }; 
  useEffect(() => {
    if (main_page === "applicantPage") {
      setActivePage("applicant");
    }
  }, [main_page]);

  const Page = PAGES[activePage] ?? PageInterview; 
  if(main_page==="applicantPage"){

    return (
      <>
        <div id="navigation-bar" className="kaushan-script-regular">ReadySetHire</div> 
        <div id="side-bar" > 
          <button id="side-bar-interview-button" onClick={() => setActivePage("interview")} className="kaushan-script-regular"> 
            Interview 
          </button> 
        </div> 
        <div id="main"> 
          <Page /> 
        </div> 
        <footer id="footer"> 
          <p>© 2025 ReadySetHire — All rights reserved.</p> 
        </footer> 
      </>
    )
  }
  return ( 
    <> 
      <div id="navigation-bar" className="kaushan-script-regular">ReadySetHire</div> 
      <div id="side-bar" > 
        <button id="side-bar-interview-button" onClick={() => setActivePage("interview")} className="kaushan-script-regular"> 
          Interview 
        </button> 
      </div> 
      <div id="main"> 
         <Page /> 
      </div> 
      <footer id="footer"> 
        <p>© 2025 ReadySetHire — All rights reserved.</p> 
      </footer> 
    </> 
  ) 
} 
 
export default App 
 