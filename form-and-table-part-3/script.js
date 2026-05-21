$(document).ready(function() {
  
  // ==========================================
  // 1. LIGHT / DARK SWITCH CONTROLLER
  // ==========================================
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    $('html').addClass('dark');
    $('#themeToggle').text('☀️ Light Mode');
  } else {
    $('html').removeClass('dark');
    $('#themeToggle').text('🌙 Dark Mode');
  }

  $('#themeToggle').on('click', function(e) {
    e.preventDefault();
    $('html').toggleClass('dark');
    if ($('html').hasClass('dark')) {
      localStorage.setItem('theme', 'dark');
      $(this).text('☀️ Light Mode');
    } else {
      localStorage.setItem('theme', 'light');
      $(this).text('🌙 Dark Mode');
    }
  });

  // ==========================================
  // 2. DATA PIPELINE WRAPPERS
  // ==========================================
  function getStoredApplications() {
    const rawData = localStorage.getItem('applicationsList');
    return rawData ? JSON.parse(rawData) : [];
  }

  function updateStoredApplications(dataArray) {
    localStorage.setItem('applicationsList', JSON.stringify(dataArray));
  }

  const table = $('#appTable').DataTable({
    dom: 'rtip', 
    pageLength: 10,
    columnDefs: [
      { className: "px-4 py-3 font-medium text-gray-900 dark:text-gray-200", targets: 0 },
      { className: "px-4 py-3", targets: [1, 3, 4, 5, 6, 7, 8] },
      { className: "px-4 py-3 text-blue-600 dark:text-blue-400 break-words max-w-[160px]", targets: 2 },
      { className: "px-4 py-3 text-center whitespace-nowrap space-x-2", targets: 9 }
    ]
  });

  function renderStoredDataToGrid() {
    table.clear();
    const records = getStoredApplications();

    records.forEach(function(item) {
      let actionsHtml = `
        <button data-uid="${item.id}" class="edit-btn text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold text-sm cursor-pointer hover:underline transition-all">Edit</button>
        <span class="text-gray-300 dark:text-gray-600">|</span>
        <button data-uid="${item.id}" class="delete-btn text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-semibold text-sm cursor-pointer hover:underline transition-all">Delete</button>
      `;

      table.row.add([
        item.name,
        item.department,
        `<a href="${item.socialLink}" target="_blank" class="hover:underline">Link</a>`,
        item.mobile,
        item.email,
        item.address,
        item.discord,
        item.discordId || 'N/A',
        item.district,
        actionsHtml
      ]);
    });
    table.draw(false);
  }

  renderStoredDataToGrid();
  let editingRecordUID = null;

  // ==========================================
  // 3. SELECTION CONTROLLERS (SEARCH, SIZE, RESET)
  // ==========================================
  $('#customSearchInput').on('keyup', function() {
    table.search(this.value).draw();
  });

  $('#searchBtn').on('click', function() {
    table.search($('#customSearchInput').val()).draw();
  });

  $('#customLengthSelector').on('change', function() {
    table.page.len(parseInt($(this).val())).draw();
  });

  $('#resetBtn').on('click', function() {
    $('#customSearchInput').val('');
    table.search('').draw();
    $('#customLengthSelector').val('10');
    table.page.len(10).draw();
    clearAllValidationErrors();
    $('#applicationForm')[0].reset();
    $('#discordIdWrapper').hide().addClass('hidden');
    editingRecordUID = null;
    $('#submitBtn').text('Submit').removeClass('bg-amber-600').addClass('bg-blue-700');
    $('#formHeading').text('Department Selection Form');
  });

  // ==========================================
  // 4. REAL-TIME EVENT DRIVEN AUTO-FORMATTERS
  // ==========================================
  
  // Enforce Uppercase Letters and Spaces Only on Name input instantly
  $('#name').on('input', function() {
    let rawCursorPos = this.selectionStart;
    let originalText = $(this).val().toUpperCase();
    
    // Strip out any characters that are NOT letters or spaces
    let cleanedText = originalText.replace(/[^A-Z\s]/g, '');
    $(this).val(cleanedText);
    
    // Prevent layout cursor jumping errors while typing mid-word
    this.setSelectionRange(rawCursorPos, rawCursorPos);
  });

  // Restrict Mobile input field to accept numbers only
  $('#mobile-number').on('input', function() {
    let cleanedNum = $(this).val().replace(/[^0-9]/g, '');
    $(this).val(cleanedNum);
  });

  // Dynamic Discord Field Slider Toggle Trigger
  $('input[name="discord"]').on('change', function() {
    if ($(this).val() === 'Yes') {
      $('#discordIdWrapper').slideDown(200).removeClass('hidden');
    } else {
      $('#discordIdWrapper').slideUp(200, function() { $(this).addClass('hidden'); });
      $('#discord-id').val('').removeClass('border-red-500');
      $('#discordIdError').addClass('hidden');
    }
  });

  // ==========================================
  // 5. ENTERPRISE VALIDATION CORE PIPELINE
  // ==========================================
  function setErrorState(inputElement, errorElement, isInvalid) {
    if (isInvalid) {
      inputElement.addClass('border-red-500 focus:ring-red-500 focus:border-red-500').removeClass('border-gray-300 focus:ring-blue-500 focus:border-blue-500');
      errorElement.removeClass('hidden');
    } else {
      inputElement.removeClass('border-red-500 focus:ring-red-500 focus:border-red-500').addClass('border-gray-300 focus:ring-blue-500 focus:border-blue-500');
      errorElement.addClass('hidden');
    }
  }

  function clearAllValidationErrors() {
    $('input, select').removeClass('border-red-500 focus:ring-red-500 focus:border-red-500');
    $('[id$="Error"]').addClass('hidden');
  }

  function validateFormInputs() {
    let isValid = true;

    // A. Name check (Letters & Spaces only, length 3-50)
    const nameVal = $('#name').val().trim();
    const isNameInvalid = nameVal.length < 3 || nameVal.length > 50;
    setErrorState($('#name'), $('#nameError'), isNameInvalid);
    if(isNameInvalid) isValid = false;

    // B. Department Radio Selection Check
    const isDeptChecked = $('input[name="department"]:checked').length > 0;
    if(!isDeptChecked) {
      $('#deptError').removeClass('hidden');
      isValid = false;
    } else {
      $('#deptError').addClass('hidden');
    }

    // C. Social Link domain validation match check
    const socialVal = $('#social-link').val().trim();
    const urlRegex = /^https:\/\/(www\.)?(linkedin\.com|github\.com|facebook\.com)\/[A-Za-z0-9_.-]+/i;
    setErrorState($('#social-link'), $('#socialError'), !urlRegex.test(socialVal));
    if(!urlRegex.test(socialVal)) isValid = false;

    // D. Bangladeshi Mobile remaining 9 digits validation check
    const mobileVal = $('#mobile-number').val().trim();

    // Regex breakdown: 
    // ^[3-9] -> Ensures the first typed digit is a valid BD operator identifier (3, 4, 5, 6, 7, 8, or 9)
    // \d{8}$ -> Followed by exactly 8 more random digits. Total length forced = 9 characters.
    const bdMobileRegex = /^[3-9]\d{8}$/; 
    const isMobileInvalid = !bdMobileRegex.test(mobileVal);

    setErrorState($('#mobile-number'), $('#mobileError'), isMobileInvalid);
    if(isMobileInvalid) isValid = false;

    // E. Email verification check
    const emailVal = $('#email').val().trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    setErrorState($('#email'), $('#emailError'), !emailRegex.test(emailVal));
    if(!emailRegex.test(emailVal)) isValid = false;

    // F. Address string length check
    const addressVal = $('#address').val().trim();
    setErrorState($('#address'), $('#addressError'), addressVal.length < 5);
    if(addressVal.length < 5) isValid = false;

    // G. Discord options checking dependencies
    const discordRadio = $('input[name="discord"]:checked').val();
    if(!discordRadio) {
      $('#discordRadioError').removeClass('hidden');
      isValid = false;
    } else {
      $('#discordRadioError').addClass('hidden');
      if (discordRadio === 'Yes') {
        const discordIdVal = $('#discord-id').val().trim();
        setErrorState($('#discord-id'), $('#discordIdError'), discordIdVal.length < 2);
        if(discordIdVal.length < 2) isValid = false;
      }
    }

    // H. District option check
    const districtVal = $('#district').val();
    setErrorState($('#district'), $('#districtError'), districtVal === "");
    if(districtVal === "") isValid = false;

    return isValid;
  }

  // Real-time error clearance listeners as the user interacts with the fields
  $('input, select').on('input change', function() {
    $(this).removeClass('border-red-500');
    $(this).closest('div').find('[id$="Error"]').addClass('hidden');
    $('#deptError, #discordRadioError').addClass('hidden');
  });

  // ==========================================
  // 6. FORM PROCESSING & ANTI-DUPLICATION ENGINE
  // ==========================================
  $('#applicationForm').on('submit', function(e) {
    e.preventDefault();

    // Run validation suite rules
    if (!validateFormInputs()) {
      return false;
    }

    let currentRecordsList = getStoredApplications();
    const inputEmail = $('#email').val().trim();
    // This correctly builds the full number inside the database context log string
    const fullMobileNumber = "+8801" + $('#mobile-number').val().trim();

    // ANTI-DUPLICATION GUARD: Blocks matches from saving twice
    let isDuplicate = currentRecordsList.some(function(item) {
      if (editingRecordUID !== null && item.id === editingRecordUID) {
        return false; // Skip checking if modifying the same row line entry
      }
      return item.email.toLowerCase() === inputEmail.toLowerCase() || item.mobile === fullMobileNumber;
    });

    if (isDuplicate) {
      alert("🛑 Submission Denied: An application profile with this Email or Mobile Number already exists inside the database logs.");
      return false;
    }

    let applicationData = {
      name: $('#name').val().trim(),
      department: $('input[name="department"]:checked').val(),
      socialLink: $('#social-link').val().trim(),
      mobile: fullMobileNumber,
      email: inputEmail,
      address: $('#address').val().trim(),
      discord: $('input[name="discord"]:checked').val(),
      discordId: $('input[name="discord"]:checked').val() === 'Yes' ? $('#discord-id').val().trim() : '',
      district: $('#district').val()
    };

    if (editingRecordUID !== null) {
      let targetIndex = currentRecordsList.findIndex(item => item.id === editingRecordUID);
      if (targetIndex !== -1) {
        applicationData.id = editingRecordUID;
        currentRecordsList[targetIndex] = applicationData;
      }
      editingRecordUID = null;
      $('#submitBtn').text('Submit').removeClass('bg-amber-600 hover:bg-amber-700').addClass('bg-blue-700 hover:bg-blue-800');
      $('#formHeading').text('Department Selection Form');
      
      // Trigger update toast notice
      showSaveNotification("Application updated successfully!");
    } else {
      applicationData.id = Date.now();
      currentRecordsList.push(applicationData);
      
      // Trigger standard save toast notice
      showSaveNotification("Application saved successfully!");
    }

    updateStoredApplications(currentRecordsList);
    renderStoredDataToGrid();
    this.reset();
    $('#discordIdWrapper').hide().addClass('hidden');
  });

  // ==========================================
  // 7. ROW HANDLING LAYERS (EDIT / DELETE)
  // ==========================================
  $('#appTable').on('click', '.edit-btn', function() {
    clearAllValidationErrors();
    const recordUID = parseInt($(this).attr('data-uid'));
    const records = getStoredApplications();
    const targetData = records.find(item => item.id === recordUID);

    if (!targetData) return;
    editingRecordUID = recordUID;

    $('#name').val(targetData.name);
    $(`input[name="department"][value="${targetData.department}"]`).prop('checked', true);
    $('#social-link').val(targetData.socialLink);
    
    // Strip prefix when moving phone string data back into the form interface viewport box
    let purePhoneDigits = targetData.mobile.replace("+8801", "");
    $('#mobile-number').val(purePhoneDigits);
    
    $('#email').val(targetData.email);
    $('#address').val(targetData.address);
    $(`input[name="discord"][value="${targetData.discord}"]`).prop('checked', true);
    $('#district').val(targetData.district);

    if (targetData.discord === 'Yes') {
      $('#discordIdWrapper').show().removeClass('hidden');
      $('#discord-id').val(targetData.discordId);
    } else {
      $('#discordIdWrapper').hide().addClass('hidden');
    }

    $('#submitBtn').text('Update Application Data').removeClass('bg-blue-700 hover:bg-blue-800').addClass('bg-amber-600 hover:bg-amber-700');
    $('#formHeading').text('📝 Editing Selected Application');

    $('html, body').animate({ scrollTop: $("#formHeading").offset().top - 20 }, 300);
  });


  // ==========================================
  // 8. ANIMATED NOTIFICATION TOAST ENGINE
  // ==========================================
  function showSaveNotification(message) {
    // Create the clean, dynamic element with dynamic Tailwind slide-in animations
    const toast = $(`
      <div class="transform translate-y-10 opacity-0 transition-all duration-500 ease-out bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-sm font-semibold px-5 py-3 rounded-xl shadow-xl flex items-center space-x-2 border border-gray-800 dark:border-gray-200 pointer-events-auto mb-3">
        <span>✅</span>
        <span>${message}</span>
      </div>
    `);

    // Append to container
    $('#toastContainer').append(toast);

    // Trigger the slide up and fade-in animation frame
    setTimeout(() => {
      toast.removeClass('translate-y-10 opacity-0').addClass('translate-y-0 opacity-100');
    }, 50);

    // After 3.5 seconds, slide it down and fade out, then clear from DOM
    setTimeout(() => {
      toast.removeClass('translate-y-0 opacity-100').addClass('translate-y-2 opacity-0');
      setTimeout(() => {
        toast.remove();
      }, 500);
    }, 3500);
  }


  // Delete Action delegation handler
  $('#appTable').on('click', '.delete-btn', function() {
    const recordUID = parseInt($(this).attr('data-uid'));
    let currentRecordsList = getStoredApplications();

    if (confirm("Are you sure you want to permanently delete this application record row?")) {
      currentRecordsList = currentRecordsList.filter(item => item.id !== recordUID);
      updateStoredApplications(currentRecordsList);
      
      if (editingRecordUID === recordUID) {
        editingRecordUID = null;
        $('#applicationForm')[0].reset();
        $('#discordIdWrapper').hide().addClass('hidden');
        $('#submitBtn').text('Submit').removeClass('bg-amber-600').addClass('bg-blue-700');
        $('#formHeading').text('Department Selection Form');
      }
      renderStoredDataToGrid();
    }
  });

});