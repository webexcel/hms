import React from 'react';

const GuestPagination = ({ currentPage, totalPages, setCurrentPage, getPageNumbers }) => {
  if (totalPages <= 1) return null;

  return (
    <nav className="mt-4">
      <ul className="pagination justify-content-center">
        <li className={`page-item${currentPage === 1 ? ' disabled' : ''}`}>
          <a
            className="page-link"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (currentPage > 1) setCurrentPage(currentPage - 1);
            }}
          >
            Previous
          </a>
        </li>
        {getPageNumbers().map((page) => (
          <li key={page} className={`page-item${currentPage === page ? ' active' : ''}`}>
            <a
              className="page-link"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setCurrentPage(page);
              }}
            >
              {page}
            </a>
          </li>
        ))}
        <li className={`page-item${currentPage === totalPages ? ' disabled' : ''}`}>
          <a
            className="page-link"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (currentPage < totalPages) setCurrentPage(currentPage + 1);
            }}
          >
            Next
          </a>
        </li>
      </ul>
    </nav>
  );
};

export default GuestPagination;
