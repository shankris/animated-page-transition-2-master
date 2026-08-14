jQuery(document).ready(function ($) {
  //set some variables
  var isAnimating = false,
    firstLoad = false,
    newScaleValue = 1;

  //cache DOM elements
  var dashboard = document.querySelector(".cd-side-navigation"),
    mainContent = $(".cd-main"),
    loadingBar = $("#cd-loading-bar");

  //select a new section
  dashboard.addEventListener("click", function (event) {
    var target = event.target.closest("a");

    if (!target || !dashboard.contains(target)) {
      return;
    }

    event.preventDefault();

    var sectionTarget = target.dataset.menu;

    if (!target.classList.contains("selected") && !isAnimating) {
      triggerAnimation(sectionTarget, true);
    }

    firstLoad = true;
  });

  //detect the 'popstate' event - e.g. user clicking the back button
  $(window).on("popstate", function () {
    if (firstLoad) {
      /*
		    Safari emits a popstate event on page load - check if firstLoad is true before animating
		    if it's false - the page has just been loaded 
		    */
      var newPageArray = location.pathname.split("/"),
        //this is the url of the page to be loaded
        newPage = newPageArray[newPageArray.length - 1].replace(".html", "");
      if (!isAnimating) triggerAnimation(newPage, false);
    }
    firstLoad = true;
  });

  //scroll to content if user clicks the .cd-scroll icon
  mainContent.on("click", ".cd-scroll", function (event) {
    event.preventDefault();
    var scrollId = $(this.hash);
    $(scrollId).velocity("scroll", { container: $(".cd-section") }, 200);
  });

  //start animation
  function triggerAnimation(newSection, bool) {
    isAnimating = true;

    newSection = newSection == "" ? "index" : newSection;

    // update dashboard
    var selectedItem = dashboard.querySelector('[data-menu="' + newSection + '"]');

    if (selectedItem) {
      selectedItem.classList.add("selected");

      var selectedItems = dashboard.querySelectorAll(".selected");

      selectedItems.forEach(function (item) {
        if (item !== selectedItem) {
          item.classList.remove("selected");
        }
      });
    }

    // trigger loading bar animation
    initializeLoadingBar(newSection);

    // load new content
    loadNewContent(newSection, bool);
  }

  function initializeLoadingBar(section) {
    var selectedItem = dashboard.find(".selected"),
      barHeight = selectedItem.outerHeight(),
      barTop = selectedItem.offset().top,
      windowHeight = $(window).height(),
      maxOffset = barTop + barHeight / 2 > windowHeight / 2 ? barTop : windowHeight - barTop - barHeight,
      scaleValue = ((2 * maxOffset + barHeight) / barHeight).toFixed(3) / 1 + 0.001;

    //place the loading bar next to the selected dashboard element
    loadingBar
      .data("scale", scaleValue)
      .css({
        height: barHeight,
        top: barTop,
      })
      .attr("class", "")
      .addClass("loading " + section);
  }

  function loadNewContent(newSection, bool) {
    setTimeout(function () {
      //animate loading bar
      loadingBarAnimation();

      //create a new section element and insert it into the DOM
      var section = $('<section class="cd-section overflow-hidden ' + newSection + '"></section>').appendTo(mainContent);
      //load the new content from the proper html file
      section.load(newSection + ".html .cd-section > *", function (event) {
        //finish up the animation and then make the new section visible
        var scaleMax = loadingBar.data("scale");

        loadingBar.removeClass("finish").addClass("finish");

        loadingBar.css("transform", "scaleY(" + scaleMax + ")");

        loadingBar.one("transitionend webkitTransitionEnd oTransitionEnd", function () {
          //add the .visible class to the new section element
          section
            .prev(".visible")
            .removeClass("visible")
            .end()
            .addClass("visible")
            .on("webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend", function () {
              resetAfterAnimation(section);
            });

          //if browser doesn't support transition
          if ($(".no-csstransitions").length > 0) {
            resetAfterAnimation(section);
          }

          var url = newSection + ".html";

          if (url != window.location && bool) {
            window.history.pushState({ path: url }, "", url);
          }
        });
      });
    }, 50);
  }

  function loadingBarAnimation() {
    var scaleMax = loadingBar.data("scale");

    if (newScaleValue + 1 < scaleMax) {
      newScaleValue = newScaleValue + 1;
    } else if (newScaleValue + 0.5 < scaleMax) {
      newScaleValue = newScaleValue + 0.5;
    }

    loadingBar.css("transform", "scaleY(" + newScaleValue + ")");

    if (newScaleValue < scaleMax) {
      setTimeout(loadingBarAnimation, 100);
    }
  }

  function resetAfterAnimation(newSection) {
    //once the new section animation is over, remove the old section and make the new one scrollable
    newSection.removeClass("overflow-hidden").prev(".cd-section").remove();
    isAnimating = false;
    //reset your loading bar
    resetLoadingBar();
  }

  function resetLoadingBar() {
    loadingBar.removeClass("loading").velocity(
      {
        scaleY: 1,
      },
      1,
    );
  }
});
