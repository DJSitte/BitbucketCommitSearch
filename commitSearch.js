$(document).ready(function(){
  flatpickr(".datepicker", {
    altFormat: "F j, Y"
  });
});

function pageRequest(arr, url, auth, page, filter){
  $.ajax({
    url: "https://bitbucket.org/api/2.0/repositories/"+ url + "/commits?pagelen=100&page=" + page,
    method: "GET",
    headers: {
      "Authorization" : "Basic "+auth
    }
  }).done(function(data){
    if(data.values){
      arr = arr.concat(data.values);
      console.log("Finished: "+page);
    }
    if(data.next && data.next != ""){
      pageRequest(arr, url, auth, page + 1, filter);
    }else{
      console.log("Found end on page " + page);
      filterArr(arr, filter);
    }
  });
}

function filterArr(arr, filter){
  if(filter["to"] && filter["to"] != ""){
    var toDateFilter = Date.parse(filter["to"]);
  }
  if(filter["from"] && filter["from"] != ""){
    var fromDateFilter = Date.parse(filter["from"]);
  }
  if(filter["user"] && filter["user"] != ""){
    var usernameFilter = filter["user"]
  }
  if(filter["desc"]){
    var sortDesc = filter["desc"] == true;
  }

  commits = _.filter(arr, function(com){
    return (usernameFilter ? com && com["author"] && com["author"]["user"] && com["author"]["user"]["username"] == usernameFilter : true) &&
       (toDateFilter ? Date.parse(com["date"]) < toDateFilter : true) && (fromDateFilter ? Date.parse(com["date"]) > fromDateFilter : true);
  });
  commits = _.sortBy(commits, 'date');
  if(sortDesc){
    commits = commits.reverse();
  }
  console.log("Commits length: "+commits.length);
  displayCommits(commits);
}

function displayCommits(commits){
  $("#commitBody").html("");
  _.each(commits, function(commit){
    var name = avatar = profLink =  "";

    var hash = commit["hash"]
    var date = commit["date"] ? commit["date"] : "";
    var commitDesc = commit["message"] ? commit["message"] : "";
    var commitLink = commit["links"] && commit["links"]["html"] && commit["links"]["html"]["href"] ? commit["links"]["html"]["href"] : "";

    if(commit["author"] && commit["author"]["user"]){
      name =  commit["author"]["user"]["display_name"] ? commit["author"]["user"]["display_name"] : "";
      if(commit["author"]["user"]["links"]){
        if(commit["author"]["user"]["links"]["avatar"] && commit["author"]["user"]["links"]["avatar"]["href"]){
          avatar = commit["author"]["user"]["links"]["avatar"]["href"];
          avatar = avatar.substring(0, avatar.length-3) + "64/";
        }
        profLink = commit["author"]["user"]["links"]["html"] && commit["author"]["user"]["links"]["html"]["href"] ? commit["author"]["user"]["links"]["html"]["href"] : "";
      }
    }else if(commit["author"] && commit["author"]["raw"]){
      name = commit["author"]["raw"].replace("<","&lt;").replace(">","&gt;");

    }

    $("#commitBody").append($("<tr id='"+hash+"'><tr>"))
    var html = createHtml(name, avatar, profLink, date, commitDesc, commitLink);
    $("#"+hash).html(html);
  });
}

function createHtml(name, avatar, profLink, date, commitDesc, commitLink){
  var date = moment(date);
  return  `<td class="avatar">
    <img src="${avatar}"/>
  </td>
  <td>
    <h4 title="${commitDesc}"><a href="${commitLink}">${commitDesc}</a></h4>
    <span class="username">${profLink && profLink != "" ? `<a href="${profLink}">${name}</a>` : name}</span>
    <span class="commit-date">${date.calendar()}</span>
  </td>`;
}

function formSubmit(event){
  event.preventDefault();
  var username = $("#username").val();
  var password = $("#password").val();
  var url = $("#url").val();
  var user = $("#userFilter").val();
  var fromDate = $("#fromDate").val();
  var toDate = $("#toDate").val();

  pageRequest([], url, btoa(username+":"+password), 1, {to: toDate, from: fromDate, user: user, desc: true});
}

pageRequest([], "hasker/plexus-jira", btoa("sitted:Blackie1"), 1, {desc: true});
