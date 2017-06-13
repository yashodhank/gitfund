// Public Domain (-) 2016-2017 The GitFund Authors.
// See the GitFund UNLICENSE file for details.

/* global particlesJS */

function defpkg(path, constructor) {
  var exports = window;
  path.split('.').forEach(function(subpath) {
    exports = exports[subpath] || (exports[subpath] = {});
  });
  constructor(exports, window);
};

defpkg('app', function(exports, root) {
  'use strict';

  var doc = root.document,
      body = doc.body,
      emailRegex = /.+@.+/,
      loc = root.location;

  doc.$ = doc.getElementById;
  doc.addEventListener('DOMContentLoaded', initApp);

  // TODO(tav): Depending on how the European Commission wants to reform the
  // "Cookie Law", may want to defer initialising until action is taken by the
  // visitor to implicitly "accept" the use of cookies, e.g. by scrolling,
  // clicking on links, etc.
  initGoogleAnalytics();

  function $(klasses) {
    return doc.getElementsByClassName(klasses)[0];
  }

  function addClass(el, className) {
    if (el.classList) {
      el.classList.add(className);
    } else if (!hasClass(el, className)) {
      el.className += " " + className;
    }
  }

  function bindClick(el, handler) {
    el.addEventListener('click', handler);
  }

  function dim(el) {
    el.style.opacity = '0.1';
  }

  function hasClass(el, className) {
    if (el.classList) {
      return el.classList.contains(className);
    }
    return !!el.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'));
  }

  function hasSelection(el) {
    if ((el.selectionStart !== null) && (el.selectionStart !== el.selectionEnd)) {
      return true;
    }
  }

  function initApp() {
    FastClick.attach(body);
    initToggler();
    initComments();
    initParticles();
    initPaymentForm();
  }

  function initComments() {
    var $disqusCount = doc.$('disqus_count');
    if (!$disqusCount) {
      return;
    }
    root.disqus_config = function() {
      this.page.url = "https://gitfund.io/tav/gitfund";
      this.page.identifier = "tav/gitfund";
    };
    root.DISQUSWIDGETS = {
      displayCount: function(info) {
        var count = info.counts[0].comments, text = "";
        if (count === 0) {
          text = "Leave a comment";
        } else if (count === 1) {
          text = "1 comment";
        } else {
          text = count + " comments";
        }
        $disqusCount.innerHTML = text;
      }
    }
    var s = doc.createElement('script');
    s.src = 'https://gitfund.disqus.com/embed.js';
    s.setAttribute('data-timestamp', +new Date());
    (doc.head || doc.body).appendChild(s);
    insertScript('https://gitfund.disqus.com/count-data.js?1=' + encodeURIComponent($disqusCount.getAttribute('data-disqus-identifier')) + "&ts=" + +new Date, false);
  }

  function initParticles() {
    if (!doc.$('particles')) {
      return;
    }
    particlesJS('particles', {
      "particles": {
        "number": {
          "value": 20,
          "density": {
            "enable": true,
            "value_area": 800
          }
        },
        "color": {
          "value": "#232d32"
        },
        "shape": {
          "type": "circle",
          "stroke": {
            "width": 0,
            "color": "#000000"
          },
          "polygon": {
            "nb_sides": 5
          },
        },
        "opacity": {
          "value": 0.5,
          "random": false,
          "anim": {
            "enable": false,
            "speed": 1,
            "opacity_min": 0.1,
            "sync": false
          }
        },
        "size": {
          "value": 3,
          "random": true,
          "anim": {
            "enable": false,
            "speed": 1,
            "size_min": 0.1,
            "sync": false
          }
        },
        "line_linked": {
          "enable": true,
          "distance": 150,
          "color": "#232d32",
          "opacity": 0.4,
          "width": 1
        },
        "move": {
          "enable": true,
          "speed": 6,
          "direction": "none",
          "random": false,
          "straight": false,
          "out_mode": "out",
          "bounce": false,
          "attract": {
            "enable": false,
            "rotateX": 600,
            "rotateY": 1200
          }
        }
      },
      "retina_detect": true
    });
  }

  function initGoogleAnalytics() {
    if (loc.host !== "gitfund.io") {
      return;
    }
    root['GoogleAnalyticsObject'] = 'ga';
    root.ga = function() {
      root.ga.q.push(arguments);
    };
    root.ga.l = 1 * new Date();
    root.ga.q = [['create', 'UA-90176-40', 'auto'], ['send', 'pageview']];
    insertScript('https://www.google-analytics.com/analytics.js', true);
  }

  function initPaymentForm() {
    var $form = doc.$('sponsor-form');
    if (!$form) {
      return;
    }
    var errors = {},
        errorElement = null,
        submitted = false,
        submitting = false,
        $name = doc.$('sponsor-name'),
        $email = doc.$('sponsor-email'),
        $territory = doc.$('sponsor-territory'),
        $taxID = doc.$('sponsor-tax-id'),
        $taxIDField = doc.$('sponsor-tax-id-field'),
        $number = doc.$('card-number'),
        $visa = doc.$('card-visa'),
        $mastercard = doc.$('card-mastercard'),
        $amex = doc.$('card-amex'),
        $expMonth = doc.$('card-exp-month'),
        $expYear = doc.$('card-exp-year'),
        $cvc = doc.$('card-cvc'),
        isUpdateForm = $email == null;
    var cardTypes = {
      'American Express': {
        hide: [$mastercard, $visa],
        show: [$amex],
        maxLength: 15,
        format: /(\d{1,4})(\d{1,6})?(\d{1,5})?/
      },
      'MasterCard': {
        hide: [$amex, $visa],
        show: [$mastercard],
        maxLength: 19,
        format: /(\d{1,4})/g
      },
      'Unknown': {
        hide: [],
        show: [$amex, $mastercard, $visa],
        maxLength: 19,
        format: /(\d{1,4})/g
      },
      'Visa': {
        hide: [$amex, $mastercard],
        show: [$visa],
        maxLength: 19,
        format: /(\d{1,4})/g
      }
    };
    var getExpMonth = function() {
      return $expMonth.options[$expMonth.selectedIndex].value;
    }
    var getExpYear = function() {
      return $expYear.options[$expYear.selectedIndex].value;
    }
    var setError = function(msg) {
      var el = doc.$('page-error');
      if (!el) {
        el = doc.createElement('div');
        el.className = 'alert-red';
        el.id = 'page-error';
        var container = $('body');
        container.insertBefore(el, container.firstChild);
      }
      el.textContent = msg;
      if (el.scrollIntoView) {
        el.scrollIntoView();
      }
    };
    var showError = function(id, msg) {
      var el = doc.$(id + '-error'),
          container = el.parentNode.parentNode;
      el.textContent = msg;
      addClass(container, 'field-error');
      errors[id] = true;
      if (errorElement === null) {
        errorElement = container;
      }
    };
    var hideError = function(id) {
      if (!errors[id]) {
        return;
      }
      errors[id] = false;
      removeClass(doc.$(id + '-error').parentNode.parentNode, 'field-error');
    };
    var isValidCVC = function(cvc) {
      if (cvc === "") {
        showError('card-cvc', "Card security code must be present.");
      } else if (!Stripe.card.validateCVC(cvc)) {
        showError('card-cvc', "Card security code format is invalid.");
      } else {
        return true;
      }
    };
    var isValidEmail = function(email) {
      if (email === "") {
        showError('sponsor-email', "Please specify your email address.");
      } else if (!emailRegex.test(email)) {
        showError('sponsor-email', "Please provide a valid email address");
      } else {
        return true;
      }
    };
    var isValidExpiration = function(month, year) {
      if (month === "") {
        showError('card-exp', "Card expiration month must be present.");
      } else if (year === "") {
        showError('card-exp', "Card expiration year must be present.");
      } else if (!Stripe.card.validateExpiry(month, year)) {
        showError('card-exp', "Card expiration date must be in the future.");
      } else {
        return true;
      }
    };
    var isValidName = function(name) {
      if (name === "") {
        showError('sponsor-name', "Please specify the name of the sponsor.");
      } else {
        return true;
      }
    };
    var isValidNumber = function(number) {
      if (number === "") {
        showError('card-number', "Card number must be present.");
      } else if (!Stripe.card.validateCardNumber(number)) {
        showError('card-number', "Card number format is invalid.");
      } else {
        return true;
      }
    };
    var isValidTerritory = function(territory) {
      if (territory === "") {
        showError('sponsor-territory', "Please select your country.");
      } else {
        return true;
      }
    };
    $name.addEventListener('input', function() {
      if (submitted && isValidName($name.value)) {
        hideError('sponsor-name');
      }
    });
    if (!isUpdateForm) {
      $email.addEventListener('input', function() {
        if (submitted && isValidEmail($email.value)) {
          hideError('backer-email');
        }
      });
      $territory.addEventListener('change', function() {
        var territory = $territory.options[$territory.selectedIndex].value,
            taxPrefix = TAX[territory],
            planRepr = root.PLANS;
        if (taxPrefix) {
          if (taxPrefix == "GB") {
            planRepr = root.PLANS_GB;
          }
          $taxID.value = taxPrefix;
          $taxIDField.style.display = 'block';
        } else {
          $taxIDField.style.display = 'none';
          $taxID.value = '';
        }
        ["bronze", "silver", "gold", "platinum"].forEach(function(tier) {
          doc.$('plan-' + tier).innerHTML = planRepr[tier];
        });
        if (submitted && isValidTerritory(territory)) {
          hideError('sponsor-territory');
        }
      });
    }
    $number.addEventListener('keypress', function(e) {
      // Ignore browser shortcuts and special characters.
      if (e.metaKey || e.ctrlKey || e.which < 32) {
        return;
      }
      // Only allow digits to be entered.
      var input = String.fromCharCode(e.which);
      if (!/\d/.test(input)) {
        e.preventDefault();
        return;
      }
      // Skip further restrictions if the input element has any selected text.
      if (hasSelection($number)) {
        return;
      }
      var number = $number.value + input,
          cardInfo = cardTypes[Stripe.card.cardType(number)];
      if (!cardInfo) {
        cardInfo = cardTypes['Unknown'];
      }
      // Limit the max length based on the card type.
      if (number.replace(/\D/g, '').length > cardInfo.maxLength) {
        e.preventDefault();
      }
    });
    $number.addEventListener('input', function() {
      var number = $number.value,
          cardInfo = cardTypes[Stripe.card.cardType(number)];
      if (!cardInfo) {
        cardInfo = cardTypes['Unknown'];
      }
      cardInfo.show.forEach(function(el) { undim(el); });
      cardInfo.hide.forEach(function(el) { dim(el); });
      // Format only when the caret is at the end of the input element.
      if (number.length === $number.selectionEnd) {
        var value = number.replace(/\D/g, '').slice(0, cardInfo.maxLength);
        if (cardInfo.format.global) {
          var match = value.match(cardInfo.format);
          if (match) {
            value = trim(match.join(' '));
            if (value !== number) {
              $number.value = value;
              number = value;
            }
          }
        } else {
          var groups = cardInfo.format.exec(value);
          if (groups) {
            groups.shift();
            value = trim(groups.join(' '));
            if (value !== number) {
              $number.value = value;
              number = value;
            }
          }
        }
      }
      if (submitted && isValidNumber(number)) {
        hideError('card-number');
      }
    });
    var handleExp = function() {
      if (submitted && isValidExpiration(getExpMonth(), getExpYear())) {
        hideError('card-exp');
      }
    };
    $expMonth.addEventListener('change', handleExp);
    $expYear.addEventListener('change', handleExp);
    $cvc.addEventListener('keypress', function(e) {
      // Ignore browser shortcuts and special characters.
      if (e.metaKey || e.ctrlKey || e.which < 32) {
        return;
      }
      // Only allow digits to be entered.
      var input = String.fromCharCode(e.which);
      if (!/\d/.test(input)) {
        e.preventDefault();
        return;
      }
    });
    $cvc.addEventListener('input', function() {
      if (submitted && isValidCVC($cvc.value)) {
        hideError('card-cvc');
      }
    });
    $form.addEventListener('submit', function(ev) {
      var number = $number.value,
          expMonth = getExpMonth(),
          expYear = getExpYear(),
          cvc = $cvc.value,
          processCard = !isUpdateForm;
      ev.preventDefault();
      if (submitting) {
        return;
      }
      submitted = true;
      submitting = true;
      errorElement = null;
      isValidName($name.value);
      if (isUpdateForm) {
        if (number !== "" || expMonth !== "" || expYear !== "" || cvc !== "") {
          processCard = true;
        }
      } else {
        isValidEmail($email.value);
        isValidTerritory($territory.options[$territory.selectedIndex].value);
      }
      if (processCard) {
        isValidNumber(number);
        isValidExpiration(expMonth, expYear);
        isValidCVC(cvc);
      }
      if (errorElement) {
        if (errorElement.scrollIntoView) {
          errorElement.scrollIntoView();
        }
        submitting = false;
      } else {
        if (!processCard) {
          $form.submit();
          return
        }
        Stripe.card.createToken({
          number: number,
          cvc: cvc,
          exp_month: expMonth,
          exp_year: expYear
        }, function(status, resp) {
          if (resp.error) {
            setError(resp.error.message);
            submitting = false;
            return;
          }
          if (status !== 200) {
            setError("Sorry, there was an unexpected error contacting the credit card processor. Please try again later.");
            console.log(resp);
            submitting = false;
            return;
          }
          doc.$('card-token').value = resp.id;
          $form.submit();
        });
      }
    });
  }

  function initToggler(className) {
    if (doc.getElementsByClassName('navicon').length === 0) {
      return;
    }
    var isOpen = false;
    var close = function() {
      unbindClick(doc, close);
      removeClass(body, 'show-navlinks');
      isOpen = false;
    };
    var toggle = function(e) {
      e.stopPropagation();
      if (isOpen) {
        close();
      } else {
        addClass(body, 'show-navlinks');
        isOpen = true;
        bindClick(doc, close);
      }
    };
    bindClick($('navicon'), toggle);
  }

  function insertScript(url, async) {
    var a = doc.createElement('script'),
        m = doc.getElementsByTagName('script')[0];
    if (async) {
      a.async = 1;
    }
    a.src = url;
    m.parentNode.insertBefore(a, m);
  }

  function removeClass(el, className) {
    if (el.classList) {
      el.classList.remove(className);
    } else if (hasClass(el, className)) {
      var reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
      el.className = el.className.replace(reg, ' ');
    }
  }

  function trim(str) {
    return str.replace(/^\s+|\s+$/g, '');
  }

  function unbindClick(el, handler) {
    el.removeEventListener('click', handler);
  }

  function undim(el) {
    el.style.opacity = '1.0';
  }

});