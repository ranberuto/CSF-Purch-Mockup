// ============================================================
// OOAD OBJECT DEFINITIONS (Object-Oriented Analysis & Design)
// ============================================================

// Purchase Request Object
class PurchaseRequest {
  constructor(id, requesterName, requesterDept, items, estimatedBudget, justification) {
    this.id = id;
    this.requesterName = requesterName;
    this.requesterDept = requesterDept;
    this.items = items; // Array of line items
    this.estimatedBudget = estimatedBudget;
    this.justification = justification;
    this.status = "Draft"; // Draft, Submitted, ForApproval, Approved, Rejected
    this.createdDate = new Date().toISOString();
    this.submittedDate = null;
    this.approvedDate = null;
    this.approverComments = "";
  }

  submit() {
    if (this.status !== "Draft") {
      throw new Error("Only draft PRs can be submitted");
    }
    this.status = "Submitted";
    this.submittedDate = new Date().toISOString();
    logAuditTrail("Purchase Request", `PR ${this.id} submitted`, "success");
  }

  approve(approverName, comments) {
    if (this.status !== "Submitted") {
      throw new Error("Only submitted PRs can be approved");
    }
    this.status = "Approved";
    this.approvedDate = new Date().toISOString();
    this.approverComments = comments;
    logAuditTrail("Purchase Request", `PR ${this.id} approved by ${approverName}`, "success");
  }

  reject(approverName, comments) {
    if (this.status !== "Submitted") {
      throw new Error("Only submitted PRs can be rejected");
    }
    this.status = "Rejected";
    this.approverComments = comments;
    logAuditTrail("Purchase Request", `PR ${this.id} rejected by ${approverName}`, "error");
  }
}

// Vendor Object
class Vendor {
  constructor(id, name, industry, contactEmail, contactPhone) {
    this.id = id;
    this.name = name;
    this.industry = industry;
    this.contactEmail = contactEmail;
    this.contactPhone = contactPhone;
    this.accreditationStatus = "Pending"; // Pending, Approved, Rejected, Suspended
    this.rating = 0; // 0-5 stars
    this.registrationDate = new Date().toISOString();
    this.documents = []; // Array of accreditation documents
  }

  updateAccreditationStatus(newStatus, reviewerName) {
    const oldStatus = this.accreditationStatus;
    this.accreditationStatus = newStatus;
    logAuditTrail("Vendor Accreditation", 
      `Vendor ${this.name} status changed from ${oldStatus} to ${newStatus} by ${reviewerName}`, 
      newStatus === "Approved" ? "success" : newStatus === "Rejected" ? "error" : "info");
  }

  setRating(newRating, reviewer) {
    if (newRating < 0 || newRating > 5) {
      throw new Error("Rating must be between 0 and 5");
    }
    this.rating = newRating;
    logAuditTrail("Vendor Rating", `${this.name} rated ${newRating} stars by ${reviewer}`, "success");
  }
}

// Approval Object
class Approval {
  constructor(requestId, approverId, approverName) {
    this.id = `APR-${Date.now()}`;
    this.requestId = requestId;
    this.approverId = approverId;
    this.approverName = approverName;
    this.status = "Pending"; // Pending, Approved, Rejected
    this.createdDate = new Date().toISOString();
    this.reviewDate = null;
    this.comments = "";
  }

  approve(comments) {
    this.status = "Approved";
    this.reviewDate = new Date().toISOString();
    this.comments = comments;
  }

  reject(comments) {
    this.status = "Rejected";
    this.reviewDate = new Date().toISOString();
    this.comments = comments;
  }
}

// Sourcing Event Object
class SourcingEvent {
  constructor(id, title, type, linkedPR, budget, issueDate, closingDate) {
    this.id = id;
    this.title = title;
    this.type = type; // RFQ, RFP, BIDDING, NEGOTIATED
    this.linkedPR = linkedPR;
    this.budget = budget;
    this.issueDate = issueDate;
    this.closingDate = closingDate;
    this.status = "Active"; // Active, Closed, Cancelled
    this.bids = [];
    this.winner = null;
  }

  addBid(vendor, amount, compliance) {
    this.bids.push({
      vendor: vendor,
      amount: amount,
      compliance: compliance,
      submittedDate: new Date().toISOString()
    });
  }

  selectWinner(vendorName) {
    this.winner = vendorName;
    this.status = "Closed";
    logAuditTrail("Bid Award", `Sourcing event ${this.id} awarded to ${vendorName}`, "success");
  }
}

// Audit Trail Object
class AuditTrail {
  constructor(module, action, status) {
    this.id = `AUD-${Date.now()}`;
    this.module = module;
    this.action = action;
    this.status = status; // success, error, warning, info
    this.timestamp = new Date().toISOString();
    this.user = localStorage.getItem("username") || "System";
  }
}

// ============================================================
// AUDIT LOGGING SYSTEM
// ============================================================

function logAuditTrail(module, action, status = "info") {
  const auditLog = new AuditTrail(module, action, status);
  
  // Get existing logs from localStorage
  let logs = JSON.parse(localStorage.getItem("auditLogs") || "[]");
  logs.push(auditLog);
  
  // Keep only last 100 logs
  if (logs.length > 100) {
    logs = logs.slice(-100);
  }
  
  localStorage.setItem("auditLogs", JSON.stringify(logs));
  console.log(`[${module}] ${action}`);
}

// ============================================================
// UTILITY: show animated toast notifications
// ============================================================

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerText = message;

  document.body.appendChild(toast);

  // Animate in
  setTimeout(() => toast.classList.add("show"), 100);

  // Auto-remove after 3s
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById("username")?.value;
  const password = document.getElementById("password")?.value;
  const role = document.getElementById("role")?.value;

  if (!username || !password || !role) {
    showToast("❌ Please fill in all fields", "error");
    return;
  }

  localStorage.setItem("role", role);
  localStorage.setItem("username", username);
  
  // Log login event
  logAuditTrail("Authentication", `User ${username} logged in as ${role}`, "success");

  // Smooth fade-out before redirect
  document.body.classList.add("fade-out");
  setTimeout(() => (location.href = "dashboard.html"), 600);
}

function login() {
  const role = document.getElementById("role")?.value;
  if (!role) {
    showToast("❌ Please select a role", "error");
    return;
  }
  localStorage.setItem("role", role);
  document.body.classList.add("fade-out");
  setTimeout(() => (location.href = "dashboard.html"), 600);
}

function submitPR() {
  const prComments = document.getElementById("prComments")?.value || "";
  const prId = "PR-2024-" + Date.now();
  
  // Create PR using OOAD class
  const pr = new PurchaseRequest(
    prId,
    localStorage.getItem("username") || "Lanbert Francisco",
    "Procurement Department",
    [],
    100000,
    prComments
  );
  
  pr.submit();
  
  showToast("✅ Purchase Request " + prId + " submitted and routed for approval", "success");
}

function approvePR() {
  const approverComments = document.getElementById("approverComments")?.value || "Approved";
  const prId = window.location.search.split("id=")[1] || "PR-2024-001";
  
  // Create and process approval using OOAD class
  const approval = new Approval(prId, 1, localStorage.getItem("username") || "Lanbert Francisco");
  approval.approve(approverComments);
  
  // Store approval in localStorage
  let approvals = JSON.parse(localStorage.getItem("approvals") || "[]");
  approvals.push(approval);
  localStorage.setItem("approvals", JSON.stringify(approvals));
  
  logAuditTrail("Purchase Request", `PR ${prId} approved with comment: ${approverComments}`, "success");
  
  showToast("✔️ Purchase Request approved", "success");
}

function rejectPR() {
  const rejectionReason = document.getElementById("approverComments")?.value || "Rejected";
  const prId = window.location.search.split("id=")[1] || "PR-2024-001";
  
  // Create and process rejection using OOAD class
  const approval = new Approval(prId, 1, localStorage.getItem("username") || "Lanbert Francisco");
  approval.reject(rejectionReason);
  
  // Store rejection in localStorage
  let approvals = JSON.parse(localStorage.getItem("approvals") || "[]");
  approvals.push(approval);
  localStorage.setItem("approvals", JSON.stringify(approvals));
  
  logAuditTrail("Purchase Request", `PR ${prId} rejected with reason: ${rejectionReason}`, "error");
  
  showToast("❌ Purchase Request rejected", "error");
}

function logout() {
  localStorage.removeItem("role");
  localStorage.removeItem("username");
  document.body.classList.add("fade-out");
  setTimeout(() => (location.href = "login.html"), 600);
}

// Page load protection
window.addEventListener("load", function () {
  const role = localStorage.getItem("role");
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  
  // Allow login page without authentication
  if (currentPage === "login.html" || currentPage === "index.html" || currentPage === "") {
    return;
  }
  
  // Redirect to login if not authenticated
  if (!role) {
    window.location.href = "login.html";
    return;
  }

  // Show role-specific content
  if (role === "approver") {
    document.getElementById("approver-actions")?.style.display = "block";
    document.getElementById("requester-actions")?.style.display = "none";
  } else {
    document.getElementById("approver-actions")?.style.display = "none";
    document.getElementById("requester-actions")?.style.display = "block";
  }

  // Fade-in animation on load
  document.body.classList.add("fade-in");
});

// Role-based element visibility
document.addEventListener("DOMContentLoaded", () => {
  const role = localStorage.getItem("role");
  if (!role) return;

  document.querySelectorAll("[data-role]").forEach(el => {
    const allowedRoles = el.dataset.role.split(" ");
    if (!allowedRoles.includes(role)) {
      el.style.display = "none";
    }
  });
});