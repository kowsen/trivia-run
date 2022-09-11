export const html = `<!DOCTYPE html>
<html>
  <head>
    <title>Express File Upload</title>
  </head>
  <body>
    <h1>Express File Upload</h1>
    <input id="file-upload" type="file" name="upload" />
    <button id="submit">SUBMIT</button>

    <script>
      const fileUpload = document.querySelector('#file-upload');

      document.querySelector('#submit').addEventListener('click', () => {
        const formData = new FormData();
        formData.append('upload', fileUpload.files[0]);

        const response = fetch('/add', {
          body: formData,
          method: 'POST',
        });

        response
          .then(value => value.json())
          .then(({ path }) => {
            alert(path);
          });
      });
    </script>
  </body>
</html>
`;
