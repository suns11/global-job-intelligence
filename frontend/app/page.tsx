
"use client";

import { FormEvent, useEffect, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

type Profile = {
  headline: string;
  summary: string;
  skills: string[];
  education: unknown[];
  experience: unknown[];
  projects: unknown[];
  languages: string[];
};

type Analysis = {
  job_title: string;
  company: string;
  country: string;
  required_skills: string[];
  education_mentions: string[];
  experience_mentions: string[];
  eligibility: { status: string; reason: string };
  source_verification: {
    status: string;
    message: string;
    sources: unknown[];
  };
  analysis_mode: string;
  notice?: string;
};

type GapResult = {
  matched_skills: string[];
  missing_skills: string[];
  required_skill_count: number;
  matched_skill_count: number;
  match_percentage: number;
  note: string;
};

export default function Home() {
  const [tab, setTab] = useState("analyze");
  const [authMode, setAuthMode] = useState("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  const [profile, setProfile] = useState<Profile>({
    headline: "",
    summary: "",
    skills: [],
    education: [],
    experience: [],
    projects: [],
    languages: [],
  });
  const [skillsText, setSkillsText] = useState("");
  const [educationText, setEducationText] = useState("");
  const [experienceText, setExperienceText] = useState("");
  const [languagesText, setLanguagesText] = useState("");

  const [title, setTitle] = useState("Junior Data Analyst");
  const [company, setCompany] = useState("");
  const [country, setCountry] = useState("Bangladesh");
  const [description, setDescription] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [gap, setGap] = useState<GapResult | null>(null);
  const [requiredSkills, setRequiredSkills] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem("gji_token");
    const savedUsername = localStorage.getItem("gji_username");
    if (savedToken) setToken(savedToken);
    if (savedUsername) setUsername(savedUsername);
  }, []);

  async function request(
    path: string,
    options: RequestInit = {},
    authenticated = false
  ) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> | undefined),
    };

    if (authenticated && token) {
      headers.Authorization = `Token ${token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const detail =
        data.detail ||
        data.username?.[0] ||
        data.email?.[0] ||
        data.password?.[0] ||
        data.job_description?.[0] ||
        "Request failed. Please check the input and backend.";
      throw new Error(detail);
    }

    return data;
  }

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setAuthMessage("");

    try {
      const isRegister = authMode === "register";
      const data = await request(
        isRegister ? "/auth/register/" : "/auth/login/",
        {
          method: "POST",
          body: JSON.stringify({
            username,
            ...(isRegister ? { email } : {}),
            password,
          }),
        }
      );

      setToken(data.token);
      setUsername(data.username);
      localStorage.setItem("gji_token", data.token);
      localStorage.setItem("gji_username", data.username);
      setPassword("");
      setAuthMessage(
        isRegister
          ? "Account created successfully. You are now logged in."
          : "Login successful."
      );
      setTab("profile");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  async function loadProfile() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const data: Profile = await request("/profile/", {}, true);
      setProfile(data);
      setSkillsText((data.skills || []).join(", "));
      setEducationText(JSON.stringify(data.education || [], null, 2));
      setExperienceText(JSON.stringify(data.experience || [], null, 2));
      setLanguagesText((data.languages || []).join(", "));
      setMessage("Profile loaded successfully.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load profile.");
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      let education: unknown[] = [];
      let experience: unknown[] = [];

      try {
        education = JSON.parse(educationText || "[]");
        experience = JSON.parse(experienceText || "[]");
      } catch {
        throw new Error(
          'Education and experience must be valid JSON arrays. Example: [{"degree":"BSc"}]'
        );
      }

      if (!Array.isArray(education) || !Array.isArray(experience)) {
        throw new Error("Education and experience must be JSON arrays.");
      }

      const payload = {
        headline: profile.headline,
        summary: profile.summary,
        skills: skillsText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        education,
        experience,
        projects: profile.projects || [],
        languages: languagesText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };

      const data = await request(
        "/profile/",
        { method: "PUT", body: JSON.stringify(payload) },
        true
      );

      setProfile(data);
      setMessage("Profile saved successfully.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save profile.");
    } finally {
      setLoading(false);
    }
  }

  async function analyzeJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    setAnalysis(null);

    try {
      const data = await request("/jobs/analyze/", {
        method: "POST",
        body: JSON.stringify({
          job_title: title,
          company,
          country,
          job_description: description,
        }),
      });
      setAnalysis(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Job analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  async function analyzeGap(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    setGap(null);

    try {
      const data = await request(
        "/skills/gap/",
        {
          method: "POST",
          body: JSON.stringify({
            required_skills: requiredSkills
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          }),
        },
        true
      );
      setGap(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Skill analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("gji_token");
    localStorage.removeItem("gji_username");
    setToken("");
    setGap(null);
    setAuthMessage("You have logged out.");
    setMessage("");
    setError("");
    setTab("auth");
  }

  return (
    <main>
      <header>
        <div className="brand">✦ GLOBAL JOB INTELLIGENCE</div>
        <span className="pill">EARLY MVP · v0.1</span>
      </header>

      <section>
        <p className="pill">One profile. Every job understood.</p>
        <h1>Apply with clarity, not guesswork.</h1>
        <p className="lead">
          Understand job requirements, manage your candidate profile, and
          compare your skills with a vacancy.
        </p>
      </section>

      <nav className="nav-tabs" aria-label="Main navigation">
        <button type="button" onClick={() => setTab("analyze")}>
          Job Analysis
        </button>
        <button type="button" onClick={() => setTab("auth")}>
          Login / Register
        </button>
        <button type="button" onClick={() => setTab("profile")}>
          My Profile
        </button>
        <button type="button" onClick={() => setTab("gap")}>
          Skill Gap
        </button>
        {token && (
          <button type="button" onClick={logout}>
            Logout ({username})
          </button>
        )}
      </nav>

      {error && <p className="error" role="alert">{error}</p>}
      {message && <p className="success-message">{message}</p>}
      {authMessage && <p className="success-message">{authMessage}</p>}

      {tab === "auth" && (
        <section className="panel section-panel">
          <h2>{authMode === "login" ? "Welcome back" : "Create your account"}</h2>
          <p className="hint">
            {authMode === "login"
              ? "Login to manage your profile and skill gap analysis."
              : "Register to create your candidate account."}
          </p>

          <div className="nav-tabs">
            <button type="button" onClick={() => setAuthMode("login")}>
              Login
            </button>
            <button type="button" onClick={() => setAuthMode("register")}>
              Register
            </button>
          </div>

          <form onSubmit={handleAuth}>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />

            {authMode === "register" && (
              <>
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </>
            )}

            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={
                authMode === "login" ? "current-password" : "new-password"
              }
              required
            />

            <button type="submit" disabled={loading}>
              {loading
                ? "Please wait..."
                : authMode === "login"
                  ? "Login"
                  : "Create account"}
            </button>
          </form>
        </section>
      )}

      {tab === "profile" && (
        <section className="panel section-panel">
          <h2>Candidate Profile</h2>
          <p className="hint">
            {token
              ? `Signed in as ${username}. Update your candidate information below.`
              : "Login first to view and save your profile."}
          </p>

          {token && (
            <>
              <button type="button" onClick={loadProfile} disabled={loading}>
                {loading ? "Loading..." : "Load saved profile"}
              </button>

              <form onSubmit={saveProfile}>
                <label htmlFor="headline">Professional headline</label>
                <input
                  id="headline"
                  value={profile.headline}
                  onChange={(e) =>
                    setProfile({ ...profile, headline: e.target.value })
                  }
                  maxLength={180}
                  placeholder="e.g. CSE Student | Aspiring Software Developer"
                />

                <label htmlFor="summary">Summary</label>
                <textarea
                  id="summary"
                  value={profile.summary}
                  onChange={(e) =>
                    setProfile({ ...profile, summary: e.target.value })
                  }
                  placeholder="Briefly describe your background and goals"
                />

                <label htmlFor="skills">Skills (comma-separated)</label>
                <input
                  id="skills"
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  placeholder="Python, Django, SQL, Git"
                />

                <label htmlFor="education">Education (JSON array)</label>
                <textarea
                  id="education"
                  value={educationText}
                  onChange={(e) => setEducationText(e.target.value)}
                  placeholder={'[{"degree":"BSc in CSE","institution":"BAIUST"}]'}
                />

                <label htmlFor="experience">Experience (JSON array)</label>
                <textarea
                  id="experience"
                  value={experienceText}
                  onChange={(e) => setExperienceText(e.target.value)}
                  placeholder={'[{"role":"Intern","company":"Example"}]'}
                />

                <label htmlFor="languages">Languages (comma-separated)</label>
                <input
                  id="languages"
                  value={languagesText}
                  onChange={(e) => setLanguagesText(e.target.value)}
                  placeholder="Bangla, English"
                />

                <button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Profile"}
                </button>
              </form>
            </>
          )}
        </section>
      )}

      {tab === "analyze" && (
        <div className="layout">
          <section className="panel">
            <h2>Analyze a job</h2>
            <p className="hint">
              Paste the job description to extract skills and requirements.
            </p>

            <form onSubmit={analyzeJob}>
              <div className="grid2">
                <div>
                  <label htmlFor="job-title">Job title</label>
                  <input
                    id="job-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    maxLength={240}
                  />
                </div>
                <div>
                  <label htmlFor="company">Company</label>
                  <input
                    id="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    maxLength={240}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <label htmlFor="country">Country / market</label>
              <input
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                maxLength={100}
              />

              <label htmlFor="description">Job description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                minLength={30}
                maxLength={30000}
                placeholder="Paste responsibilities, qualifications, skills and application instructions..."
              />

              <button type="submit" disabled={loading}>
                {loading ? "Analyzing..." : "Analyze requirements →"}
              </button>
            </form>

            {analysis && (
              <div className="result" aria-live="polite">
                <h2>Analysis: {analysis.job_title}</h2>
                <p className="small">Analysis mode: {analysis.analysis_mode}</p>

                <div className="notice">
                  <strong>
                    Verification status: {analysis.source_verification.status}
                  </strong>
                  <p>{analysis.source_verification.message}</p>
                </div>

                <h3>Skills mentioned</h3>
                <div className="tags">
                  {(analysis.required_skills || []).map((skill) => (
                    <span className="tag" key={skill}>{skill}</span>
                  ))}
                </div>

                <h3>Education mentions</h3>
                <ul>
                  {(analysis.education_mentions || []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>

                <h3>Experience mentions</h3>
                <ul>
                  {(analysis.experience_mentions || []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>

                <h3>Eligibility</h3>
                <p>
                  {analysis.eligibility.status}: {analysis.eligibility.reason}
                </p>
              </div>
            )}
          </section>

          <aside className="panel">
            <h2>What this MVP does</h2>
            <ul>
              <li>Extracts skills and common requirement phrases.</li>
              <li>Uses an optional AI API with a fallback if unavailable.</li>
              <li>Separates text extraction from independent verification.</li>
              <li>Supports a candidate profile and skill comparison.</li>
            </ul>

            <h2 style={{ marginTop: 28 }}>Important limitations</h2>
            <ul>
              <li>It does not predict whether an employer will hire you.</li>
              <li>Employer and immigration rules are not independently verified.</li>
              <li>Analysis quality depends on the supplied job description.</li>
            </ul>
          </aside>
        </div>
      )}

      {tab === "gap" && (
        <section className="panel section-panel">
          <h2>Skill Gap Analysis</h2>
          <p className="hint">
            Compare job requirements with the skills saved in your profile.
            Login and save your profile first.
          </p>

          {token ? (
            <form onSubmit={analyzeGap}>
              <label htmlFor="required-skills">
                Required job skills (comma-separated)
              </label>
              <textarea
                id="required-skills"
                value={requiredSkills}
                onChange={(e) => setRequiredSkills(e.target.value)}
                required
                placeholder="Python, SQL, Django, Git, React"
              />
              <button type="submit" disabled={loading}>
                {loading ? "Comparing..." : "Compare Skills"}
              </button>
            </form>
          ) : (
            <p>Please login first to use Skill Gap Analysis.</p>
          )}

          {gap && (
            <div className="result" aria-live="polite">
              <h3>Skill match: {gap.match_percentage}%</h3>
              <p>
                Matched {gap.matched_skill_count} of {gap.required_skill_count}{" "}
                required skills.
              </p>

              <h3>Matched skills</h3>
              <div className="tags">
                {gap.matched_skills.map((skill) => (
                  <span className="tag" key={skill}>{skill}</span>
                ))}
              </div>

              <h3>Skills to develop</h3>
              <div className="tags">
                {gap.missing_skills.map((skill) => (
                  <span className="tag" key={skill}>{skill}</span>
                ))}
              </div>

              <p className="small">{gap.note}</p>
            </div>
          )}
        </section>
      )}

      <p className="small" style={{ marginTop: 24 }}>
        Prototype only. Do not use sensitive personal information in an
        unreviewed deployment. This demo stores the login token in browser
        local storage; use a more secure authentication design before production.
      </p>
    </main>
  );
}
